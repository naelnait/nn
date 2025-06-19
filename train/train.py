import os
import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler
from torch.utils.data.dataset import Dataset
import torch.optim as optim
from transformers import get_cosine_schedule_with_warmup
import wandb
import json
import time
import math
import random
import numpy as np
from typing import Dict, List, Optional
import argparse
from pathlib import Path
import tiktoken
from model import DeepSeekMathConfig, DeepSeekMathForCausalLM

class MathDataset(Dataset):
    """Dataset for mathematical text data"""
    
    def __init__(self, data_path: str, tokenizer, max_length: int = 4096, split: str = "train"):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.data = []
        
        # Load mathematical datasets
        # This would include sources like:
        # - Mathematical papers (arXiv)
        # - Mathematical problem-solution pairs
        # - Formal mathematical proofs
        # - Mathematical textbooks
        # - Code for mathematical computations
        
        if os.path.exists(data_path):
            with open(data_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        sample = json.loads(line)
                        if 'text' in sample:
                            self.data.append(sample['text'])
                    except json.JSONDecodeError:
                        continue
        else:
            # Dummy data for demonstration
            self.data = self._generate_dummy_math_data()
    
    def _generate_dummy_math_data(self):
        """Generate dummy mathematical data for demonstration"""
        dummy_data = [
            "Theorem: For any real numbers a and b, (a + b)² = a² + 2ab + b². Proof: (a + b)² = (a + b)(a + b) = a(a + b) + b(a + b) = a² + ab + ba + b² = a² + 2ab + b².",
            "Problem: Solve the equation 2x + 5 = 13. Solution: 2x + 5 = 13, 2x = 13 - 5, 2x = 8, x = 4.",
            "Definition: A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.",
            "Lemma: If n is a composite number, then n has a prime divisor less than or equal to √n.",
            "Calculate the derivative of f(x) = x³ + 2x² - 5x + 1. f'(x) = 3x² + 4x - 5.",
        ] * 1000  # Repeat for more data
        return dummy_data
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        text = self.data[idx]
        
        # Tokenize the text
        tokens = self.tokenizer.encode(text)
        
        # Truncate or pad to max_length
        if len(tokens) > self.max_length:
            tokens = tokens[:self.max_length]
        else:
            # Pad with tokenizer's pad token if available, otherwise use 0
            pad_token = getattr(self.tokenizer, 'pad_token_id', 0)
            tokens.extend([pad_token] * (self.max_length - len(tokens)))
        
        return {
            'input_ids': torch.tensor(tokens, dtype=torch.long),
            'labels': torch.tensor(tokens, dtype=torch.long)
        }

class DeepSeekMathTrainer:
    def __init__(self, config: Dict):
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.setup_distributed_training()
        self.setup_model()
        self.setup_tokenizer()
        self.setup_datasets()
        self.setup_optimizer()
        self.setup_logging()
        
    def setup_distributed_training(self):
        """Setup distributed training if available"""
        self.is_distributed = False
        if 'WORLD_SIZE' in os.environ:
            self.is_distributed = True
            self.world_size = int(os.environ['WORLD_SIZE'])
            self.rank = int(os.environ['RANK'])
            self.local_rank = int(os.environ['LOCAL_RANK'])
            
            # Initialize distributed training
            dist.init_process_group(backend='nccl')
            torch.cuda.set_device(self.local_rank)
            self.device = torch.device(f'cuda:{self.local_rank}')
        else:
            self.world_size = 1
            self.rank = 0
            self.local_rank = 0
    
    def setup_model(self):
        """Initialize the DeepSeek-Math model"""
        model_config = DeepSeekMathConfig(
            vocab_size=self.config['vocab_size'],
            hidden_size=self.config['hidden_size'],
            intermediate_size=self.config['intermediate_size'],
            num_hidden_layers=self.config['num_hidden_layers'],
            num_attention_heads=self.config['num_attention_heads'],
            max_position_embeddings=self.config['max_position_embeddings'],
            rms_norm_eps=self.config['rms_norm_eps'],
            rope_theta=self.config['rope_theta'],
        )
        
        self.model = DeepSeekMathForCausalLM(model_config)
        self.model = self.model.to(self.device)
        
        if self.is_distributed:
            self.model = DDP(self.model, device_ids=[self.local_rank])
        
        # Print model statistics
        if self.rank == 0:
            total_params = sum(p.numel() for p in self.model.parameters())
            trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
            print(f"Total parameters: {total_params:,}")
            print(f"Trainable parameters: {trainable_params:,}")
    
    def setup_tokenizer(self):
        """Setup tokenizer (using tiktoken for GPT-4 tokenizer)"""
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        except:
            # Fallback to a simple character-level tokenizer
            self.tokenizer = SimpleTokenizer(vocab_size=self.config['vocab_size'])
    
    def setup_datasets(self):
        """Setup training and validation datasets"""
        train_dataset = MathDataset(
            data_path=self.config['train_data_path'],
            tokenizer=self.tokenizer,
            max_length=self.config['max_length'],
            split='train'
        )
        
        val_dataset = MathDataset(
            data_path=self.config['val_data_path'],
            tokenizer=self.tokenizer,
            max_length=self.config['max_length'],
            split='val'
        )
        
        # Setup distributed samplers
        train_sampler = DistributedSampler(train_dataset) if self.is_distributed else None
        val_sampler = DistributedSampler(val_dataset) if self.is_distributed else None
        
        self.train_dataloader = DataLoader(
            train_dataset,
            batch_size=self.config['batch_size'],
            sampler=train_sampler,
            shuffle=(train_sampler is None),
            num_workers=self.config['num_workers'],
            pin_memory=True
        )
        
        self.val_dataloader = DataLoader(
            val_dataset,
            batch_size=self.config['batch_size'],
            sampler=val_sampler,
            shuffle=False,
            num_workers=self.config['num_workers'],
            pin_memory=True
        )
    
    def setup_optimizer(self):
        """Setup optimizer and learning rate scheduler"""
        # AdamW optimizer with weight decay
        no_decay = ['bias', 'LayerNorm.weight', 'layernorm.weight']
        optimizer_grouped_parameters = [
            {
                'params': [p for n, p in self.model.named_parameters() 
                          if not any(nd in n for nd in no_decay)],
                'weight_decay': self.config['weight_decay']
            },
            {
                'params': [p for n, p in self.model.named_parameters() 
                          if any(nd in n for nd in no_decay)],
                'weight_decay': 0.0
            }
        ]
        
        self.optimizer = optim.AdamW(
            optimizer_grouped_parameters,
            lr=self.config['learning_rate'],
            betas=(self.config['adam_beta1'], self.config['adam_beta2']),
            eps=self.config['adam_epsilon']
        )
        
        # Calculate total training steps
        self.total_steps = len(self.train_dataloader) * self.config['num_epochs']
        self.warmup_steps = int(self.total_steps * self.config['warmup_ratio'])
        
        # Cosine learning rate scheduler with warmup
        self.scheduler = get_cosine_schedule_with_warmup(
            self.optimizer,
            num_warmup_steps=self.warmup_steps,
            num_training_steps=self.total_steps
        )
    
    def setup_logging(self):
        """Setup logging with wandb"""
        if self.rank == 0:
            wandb.init(
                project=self.config['project_name'],
                name=self.config['run_name'],
                config=self.config
            )
    
    def save_checkpoint(self, epoch: int, step: int, loss: float):
        """Save model checkpoint"""
        if self.rank == 0:
            checkpoint_dir = Path(self.config['checkpoint_dir'])
            checkpoint_dir.mkdir(parents=True, exist_ok=True)
            
            model_to_save = self.model.module if hasattr(self.model, 'module') else self.model
            
            checkpoint = {
                'epoch': epoch,
                'step': step,
                'model_state_dict': model_to_save.state_dict(),
                'optimizer_state_dict': self.optimizer.state_dict(),
                'scheduler_state_dict': self.scheduler.state_dict(),
                'loss': loss,
                'config': self.config
            }
            
            checkpoint_path = checkpoint_dir / f'checkpoint_epoch_{epoch}_step_{step}.pt'
            torch.save(checkpoint, checkpoint_path)
            
            # Keep only the last N checkpoints
            checkpoints = sorted(checkpoint_dir.glob('checkpoint_*.pt'))
            if len(checkpoints) > self.config['max_checkpoints']:
                for old_checkpoint in checkpoints[:-self.config['max_checkpoints']]:
                    old_checkpoint.unlink()
            
            print(f"Checkpoint saved: {checkpoint_path}")
    
    def load_checkpoint(self, checkpoint_path: str):
        """Load model checkpoint"""
        checkpoint = torch.load(checkpoint_path, map_location=self.device)
        
        model_to_load = self.model.module if hasattr(self.model, 'module') else self.model
        model_to_load.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        
        return checkpoint['epoch'], checkpoint['step'], checkpoint['loss']
    
    def compute_loss(self, batch):
        """Compute the loss for a batch"""
        input_ids = batch['input_ids'].to(self.device)
        labels = batch['labels'].to(self.device)
        
        outputs = self.model(input_ids=input_ids, labels=labels)
        return outputs['loss']
    
    def train_epoch(self, epoch: int):
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        num_batches = len(self.train_dataloader)
        
        if self.is_distributed:
            self.train_dataloader.sampler.set_epoch(epoch)
        
        for step, batch in enumerate(self.train_dataloader):
            # Forward pass
            loss = self.compute_loss(batch)
            
            # Backward pass
            loss.backward()
            
            # Gradient clipping
            if self.config['max_grad_norm'] > 0:
                torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(), 
                    self.config['max_grad_norm']
                )
            
            # Optimizer step
            self.optimizer.step()
            self.scheduler.step()
            self.optimizer.zero_grad()
            
            total_loss += loss.item()
            
            # Logging
            if step % self.config['log_interval'] == 0 and self.rank == 0:
                avg_loss = total_loss / (step + 1)
                lr = self.scheduler.get_last_lr()[0]
                
                print(f"Epoch {epoch}, Step {step}/{num_batches}, "
                      f"Loss: {loss.item():.4f}, Avg Loss: {avg_loss:.4f}, "
                      f"LR: {lr:.2e}")
                
                wandb.log({
                    'train/loss': loss.item(),
                    'train/avg_loss': avg_loss,
                    'train/learning_rate': lr,
                    'train/epoch': epoch,
                    'train/step': step
                })
            
            # Save checkpoint
            if step % self.config['save_interval'] == 0 and step > 0:
                self.save_checkpoint(epoch, step, loss.item())
        
        return total_loss / num_batches
    
    def validate(self, epoch: int):
        """Validate the model"""
        self.model.eval()
        total_loss = 0
        num_batches = len(self.val_dataloader)
        
        with torch.no_grad():
            for step, batch in enumerate(self.val_dataloader):
                loss = self.compute_loss(batch)
                total_loss += loss.item()
        
        avg_loss = total_loss / num_batches
        perplexity = math.exp(avg_loss)
        
        if self.rank == 0:
            print(f"Validation - Epoch {epoch}, Loss: {avg_loss:.4f}, "
                  f"Perplexity: {perplexity:.2f}")
            
            wandb.log({
                'val/loss': avg_loss,
                'val/perplexity': perplexity,
                'val/epoch': epoch
            })
        
        return avg_loss
    
    def train(self):
        """Main training loop"""
        print("Starting training...")
        
        best_val_loss = float('inf')
        
        for epoch in range(self.config['num_epochs']):
            print(f"\n=== Epoch {epoch + 1}/{self.config['num_epochs']} ===")
            
            # Training
            train_loss = self.train_epoch(epoch)
            
            # Validation
            val_loss = self.validate(epoch)
            
            # Save best model
            if val_loss < best_val_loss and self.rank == 0:
                best_val_loss = val_loss
                best_model_path = Path(self.config['checkpoint_dir']) / 'best_model.pt'
                model_to_save = self.model.module if hasattr(self.model, 'module') else self.model
                torch.save(model_to_save.state_dict(), best_model_path)
                print(f"Best model saved with validation loss: {best_val_loss:.4f}")
            
            # Save epoch checkpoint
            self.save_checkpoint(epoch, len(self.train_dataloader), train_loss)
        
        if self.rank == 0:
            print("Training completed!")
            wandb.finish()

class SimpleTokenizer:
    """Simple character-level tokenizer as fallback"""
    def __init__(self, vocab_size: int = 50000):
        self.vocab_size = vocab_size
        self.pad_token_id = 0
        
    def encode(self, text: str) -> List[int]:
        # Simple character-level encoding
        return [min(ord(c), self.vocab_size - 1) for c in text]

def parse_args():
    parser = argparse.ArgumentParser(description='DeepSeek-Math Pretraining')
    
    # Model configuration
    parser.add_argument('--vocab_size', type=int, default=102400)
    parser.add_argument('--hidden_size', type=int, default=4096)
    parser.add_argument('--intermediate_size', type=int, default=11008)
    parser.add_argument('--num_hidden_layers', type=int, default=30)
    parser.add_argument('--num_attention_heads', type=int, default=32)
    parser.add_argument('--max_position_embeddings', type=int, default=4096)
    parser.add_argument('--max_length', type=int, default=2048)
    
    # Training configuration
    parser.add_argument('--batch_size', type=int, default=8)
    parser.add_argument('--num_epochs', type=int, default=3)
    parser.add_argument('--learning_rate', type=float, default=1e-4)
    parser.add_argument('--weight_decay', type=float, default=0.1)
    parser.add_argument('--adam_beta1', type=float, default=0.9)
    parser.add_argument('--adam_beta2', type=float, default=0.95)
    parser.add_argument('--adam_epsilon', type=float, default=1e-8)
    parser.add_argument('--warmup_ratio', type=float, default=0.03)
    parser.add_argument('--max_grad_norm', type=float, default=1.0)
    
    # Data paths
    parser.add_argument('--train_data_path', type=str, default='data/train.jsonl')
    parser.add_argument('--val_data_path', type=str, default='data/val.jsonl')
    
    # Logging and checkpointing
    parser.add_argument('--checkpoint_dir', type=str, default='checkpoints')
    parser.add_argument('--log_interval', type=int, default=100)
    parser.add_argument('--save_interval', type=int, default=1000)
    parser.add_argument('--max_checkpoints', type=int, default=5)
    parser.add_argument('--project_name', type=str, default='deepseek-math')
    parser.add_argument('--run_name', type=str, default='pretraining')
    
    # System configuration
    parser.add_argument('--num_workers', type=int, default=4)
    parser.add_argument('--rms_norm_eps', type=float, default=1e-6)
    parser.add_argument('--rope_theta', type=float, default=10000.0)
    
    return parser.parse_args()

def set_seed(seed: int = 42):
    """Set random seed for reproducibility"""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

def main():
    args = parse_args()
    set_seed(42)
    
    # Convert args to config dict
    config = vars(args)
    
    # Initialize trainer
    trainer = DeepSeekMathTrainer(config)
    
    # Start training
    trainer.train()

if __name__ == "__main__":
    main()

# Example usage with distributed training:
# torchrun --nproc_per_node=8 --nnodes=1 deepseek_math_training.py \
#     --batch_size 4 \
#     --learning_rate 1e-4 \
#     --num_epochs 3 \
#     --train_data_path /path/to/train.jsonl \
#     --val_data_path /path/to/val.jsonl \
#     --checkpoint_dir ./checkpoints \
#     --project_name deepseek-math-7b \
#     --run_name pretraining_run_1

# Data preprocessing script for mathematical datasets
def preprocess_math_data():
    """
    Example preprocessing script for mathematical datasets
    This would typically process:
    - ArXiv papers in mathematics
    - Mathematical problem-solution pairs
    - Formal proofs
    - Mathematical textbooks
    - Code for mathematical computations
    """
    
    import re
    from pathlib import Path
    
    def clean_math_text(text: str) -> str:
        """Clean and normalize mathematical text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Normalize mathematical notation
        text = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'(\1)/(\2)', text)
        text = re.sub(r'\\sqrt\{([^}]+)\}', r'sqrt(\1)', text)
        
        # Clean up common LaTeX commands
        text = re.sub(r'\\[a-zA-Z]+\{([^}]*)\}', r'\1', text)
        text = re.sub(r'\\[a-zA-Z]+', '', text)
        
        return text.strip()
    
    def process_file(input_path: str, output_path: str):
        """Process a single file and save cleaned data"""
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split into chunks (could be paragraphs, sections, etc.)
        chunks = content.split('\n\n')
        
        processed_data = []
        for chunk in chunks:
            if len(chunk.strip()) > 50:  # Filter out very short chunks
                cleaned = clean_math_text(chunk)
                if cleaned:
                    processed_data.append({'text': cleaned})
        
        # Save as JSONL
        with open(output_path, 'w', encoding='utf-8') as f:
            for item in processed_data:
                f.write(json.dumps(item) + '\n')
    
    # Example usage
    input_dir = Path('raw_data')
    output_dir = Path('processed_data')
    output_dir.mkdir(exist_ok=True)
    
    for file_path in input_dir.glob('*.txt'):
        output_path = output_dir / f"{file_path.stem}.jsonl"
        process_file(str(file_path), str(output_path))
        print(f"Processed {file_path} -> {output_path}")

if __name__ == "__main__":
    # Uncomment to run data preprocessing
    # preprocess_math_data()
    
    # Run main training
    main()