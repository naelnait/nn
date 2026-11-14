"""Génère le catalogue marque → modèle → catégorie de véhicule.

Sources officielles (data.gouv.fr, ADEME / UTAC) : fichiers « Car Labelling » des véhicules
particuliers commercialisés en France, éditions 2012, 2013, 2014 et l'édition courante.
Champs utilisés : marque, modèle, Carrosserie, gamme.

Complément manuel (MANUAL ci-dessous) : modèles sortis entre 2015 et 2024 absents de ces
éditions, et utilitaires immatriculés en camionnette (genre CTTE), hors du champ de ces fichiers.

Usage : python3 scripts/build_vehicle_catalog.py <dossier des CSV téléchargés>
Sorties : src/data/vehicles.json et supabase/vehicle_catalog.sql
"""
import csv, glob, io, json, os, re, sys
from collections import Counter, defaultdict

SRC = sys.argv[1]
ROOT = os.path.join(os.path.dirname(__file__), '..')

BRAND_FIX = {
    'ALFA-ROMEO': 'ALFA ROMEO', 'B.M.W.': 'BMW', 'LAMBORGHIN': 'LAMBORGHINI', 'ROLLS ROYC': 'ROLLS-ROYCE',
    'ROLLS-ROYCE': 'ROLLS-ROYCE', 'M.G.': 'MG', 'MERCEDES-BENZ': 'MERCEDES', 'MERCEDES BENZ': 'MERCEDES',
    'LAND-ROVER': 'LAND ROVER', 'CITROEN DS': 'DS', 'ASTON-MARTIN': 'ASTON MARTIN', 'SSANGYONG': 'SSANGYONG',
    'MITSUBISHI MOTORS': 'MITSUBISHI', 'VOLKSWAGEN VP': 'VOLKSWAGEN', 'VW': 'VOLKSWAGEN',
    'MERCEDES AMG': 'MERCEDES', 'QUATTRO': 'AUDI', 'RENAULT TECH': 'RENAULT', 'JAGUAR LAND ROVER LIMITED': 'LAND ROVER',
}
# Préparateurs / transformateurs : modèles déjà couverts par la marque d'origine
SKIP_BRANDS = {'DANGEL'}
MIN_SHARE = 0.12  # une catégorie représentant moins de 12 % des lignes d'un modèle est considérée comme du bruit

GAMME = {
    'ECONOMIQUE': 'eco', 'INFERIEURE': 'inf', 'MOY-INFER': 'moyinf', 'MOYENNE INFERIEURE': 'moyinf',
    'MOY-SUPER': 'moysup', 'MOYENNE SUPERIEURE': 'moysup', 'SUPERIEURE': 'sup', 'LUXE': 'luxe',
}


def category(carrosserie: str, gamme: str) -> str | None:
    c = carrosserie.strip().upper()
    g = GAMME.get(gamme.strip().upper(), '')
    if c == 'MINIBUS':
        return 'utilitaire'
    if c.startswith('TS TERRAINS'):
        return 'suv'
    if c.startswith(('MONOSPACE', 'COMBISP', 'MINISPACE')):
        return 'monospace'
    if c == 'BREAK':
        return 'berline'
    if c in ('BERLINE', 'COUPE', 'CABRIOLET'):
        return 'citadine' if g in ('eco', 'inf') else 'berline'
    return None


def read_rows(path):
    raw = open(path, 'rb').read()
    try:
        txt = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        txt = raw.decode('latin1')
    rows = list(csv.reader(io.StringIO(txt), delimiter=';'))
    head = [h.strip().lower() for h in rows[0]]

    def col(*names):
        for n in names:
            if n in head:
                return head.index(n)
        return None

    ib = col('marque', 'lib_mrq')
    im = col('modèle', 'modèle utac', 'lib_mod')
    ic = col('carrosserie')
    ig = col('gamme')
    if None in (ib, im, ic, ig):
        return
    for r in rows[1:]:
        if len(r) <= max(ib, im, ic, ig):
            continue
        yield r[ib], r[im], r[ic], r[ig]


def clean_brand(b):
    b = re.sub(r'\s+', ' ', b.strip().upper())
    return BRAND_FIX.get(b, b)


def clean_model(b, m):
    m = re.sub(r'\s+', ' ', m.strip().upper())
    m = re.sub(r'\s*\(.*?\)\s*', ' ', m).strip()
    if b == 'MERCEDES':
        # « A 180 » -> « CLASSE A », « CLA 200 » -> « CLA », « ML 350 » -> « CLASSE M »
        tok = m.split(' ')[0]
        if tok in ('CITAN', 'SPRINTER', 'VITO', 'VIANO', 'CLASSE', 'MARCO', 'X', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'EQV', 'MAYBACH'):
            return m
        if tok == 'ML':
            return 'CLASSE M'
        if len(tok) == 1 and tok.isalpha():
            return f'CLASSE {tok}'
        return re.sub(r'\d.*$', '', tok).strip() or m
    if b == 'BMW' and re.fullmatch(r'\d{3}[A-Z]*( .*)?', m):
        return f'SERIE {m[0]}'
    return m


catalog = defaultdict(lambda: defaultdict(Counter))
for path in sorted(glob.glob(os.path.join(SRC, '**', '*.csv'), recursive=True)):
    n = 0
    for b, m, c, g in read_rows(path) or []:
        cat = category(c, g)
        b = clean_brand(b)
        m = clean_model(b, m)
        if cat and b and m and b not in SKIP_BRANDS:
            catalog[b][m][cat] += 1
            n += 1
    print(f'{os.path.basename(path)} : {n} lignes retenues', file=sys.stderr)

# Complément manuel : (marque, modèle, catégories)
MANUAL = [
    # Modèles 2015-2024 absents des éditions ADEME disponibles
    ('PEUGEOT', '5008', ['suv']), ('PEUGEOT', '408', ['berline']), ('PEUGEOT', 'RIFTER', ['monospace', 'utilitaire']),
    ('RENAULT', 'KADJAR', ['suv']), ('RENAULT', 'ARKANA', ['suv']), ('RENAULT', 'AUSTRAL', ['suv']),
    ('RENAULT', 'ESPACE', ['monospace', 'suv']), ('RENAULT', 'MEGANE E-TECH', ['suv']), ('RENAULT', 'SCENIC E-TECH', ['suv']),
    ('RENAULT', 'RAFALE', ['suv']), ('RENAULT', 'SYMBIOZ', ['suv']), ('RENAULT', 'ZOE', ['citadine']), ('RENAULT', 'R5 E-TECH', ['citadine']),
    ('DACIA', 'DUSTER', ['suv']), ('DACIA', 'JOGGER', ['monospace']), ('DACIA', 'SPRING', ['citadine']), ('DACIA', 'BIGSTER', ['suv']),
    ('CITROEN', 'C3 AIRCROSS', ['suv']), ('CITROEN', 'C5 AIRCROSS', ['suv']), ('CITROEN', 'C5 X', ['berline']), ('CITROEN', 'AMI', ['citadine']),
    ('CITROEN', 'C4 X', ['berline']), ('DS', 'DS 7', ['suv']), ('DS', 'DS 3', ['suv']), ('DS', 'DS 9', ['berline']),
    ('VOLKSWAGEN', 'T-ROC', ['suv']), ('VOLKSWAGEN', 'T-CROSS', ['suv']), ('VOLKSWAGEN', 'TAIGO', ['suv']), ('VOLKSWAGEN', 'ID.3', ['berline']),
    ('VOLKSWAGEN', 'ID.4', ['suv']), ('VOLKSWAGEN', 'ID.5', ['suv']), ('VOLKSWAGEN', 'ID. BUZZ', ['monospace', 'utilitaire']),
    ('VOLKSWAGEN', 'ARTEON', ['berline']), ('VOLKSWAGEN', 'TOURAN', ['monospace']),
    ('TESLA', 'MODEL 3', ['berline']), ('TESLA', 'MODEL Y', ['suv']), ('TESLA', 'MODEL S', ['berline']), ('TESLA', 'MODEL X', ['suv']),
    ('TOYOTA', 'C-HR', ['suv']), ('TOYOTA', 'YARIS CROSS', ['suv']), ('TOYOTA', 'AYGO X', ['citadine']), ('TOYOTA', 'COROLLA', ['berline']),
    ('TOYOTA', 'BZ4X', ['suv']), ('TOYOTA', 'PROACE CITY', ['monospace', 'utilitaire']),
    ('HYUNDAI', 'KONA', ['suv']), ('HYUNDAI', 'BAYON', ['suv']), ('HYUNDAI', 'IONIQ 5', ['suv']), ('HYUNDAI', 'IONIQ 6', ['berline']),
    ('KIA', 'NIRO', ['suv']), ('KIA', 'STONIC', ['suv']), ('KIA', 'XCEED', ['suv']), ('KIA', 'EV6', ['suv']), ('KIA', 'EV9', ['suv']),
    ('NISSAN', 'ARIYA', ['suv']), ('MG', 'MG4', ['berline']), ('MG', 'ZS', ['suv']), ('MG', 'HS', ['suv']), ('MG', 'MG3', ['citadine']),
    ('OPEL', 'GRANDLAND', ['suv']), ('OPEL', 'CROSSLAND', ['suv']), ('OPEL', 'MOKKA', ['suv']), ('OPEL', 'ROCKS-E', ['citadine']),
    ('FORD', 'PUMA', ['suv']), ('FORD', 'MUSTANG MACH-E', ['suv']), ('FORD', 'EXPLORER', ['suv']),
    ('SEAT', 'ARONA', ['suv']), ('SEAT', 'ATECA', ['suv']), ('SEAT', 'TARRACO', ['suv']),
    ('CUPRA', 'FORMENTOR', ['suv']), ('CUPRA', 'BORN', ['berline']), ('CUPRA', 'LEON', ['berline']), ('CUPRA', 'TAVASCAN', ['suv']),
    ('SKODA', 'KAMIQ', ['suv']), ('SKODA', 'KAROQ', ['suv']), ('SKODA', 'KODIAQ', ['suv']), ('SKODA', 'ENYAQ', ['suv']), ('SKODA', 'SCALA', ['berline']),
    ('JEEP', 'AVENGER', ['suv']), ('FIAT', '600', ['suv']), ('FIAT', '500X', ['suv']), ('FIAT', 'TIPO', ['berline']),
    ('BMW', 'X2', ['suv']), ('BMW', 'IX', ['suv']), ('BMW', 'IX1', ['suv']), ('BMW', 'I4', ['berline']),
    ('MERCEDES', 'GLB', ['suv']), ('MERCEDES', 'EQA', ['suv']), ('MERCEDES', 'EQB', ['suv']), ('MERCEDES', 'EQC', ['suv']),
    ('AUDI', 'Q2', ['suv']), ('AUDI', 'Q4 E-TRON', ['suv']), ('AUDI', 'E-TRON', ['suv']), ('VOLVO', 'XC40', ['suv']), ('VOLVO', 'EX30', ['suv']),
    ('SUZUKI', 'S-CROSS', ['suv']), ('SUZUKI', 'IGNIS', ['citadine']), ('BYD', 'ATTO 3', ['suv']), ('BYD', 'DOLPHIN', ['berline']), ('BYD', 'SEAL', ['berline']),
    ('POLESTAR', '2', ['berline']), ('LYNK & CO', '01', ['suv']), ('SMART', '#1', ['suv']), ('SMART', 'FORTWO', ['citadine']),
    # Utilitaires : versions camionnette (genre CTTE sur la carte grise), hors champ des fichiers ADEME
    ('RENAULT', 'KANGOO', ['monospace', 'utilitaire']), ('RENAULT', 'KANGOO VAN', ['utilitaire']), ('RENAULT', 'EXPRESS', ['utilitaire']),
    ('RENAULT', 'TRAFIC', ['utilitaire']), ('RENAULT', 'MASTER', ['utilitaire']),
    ('PEUGEOT', 'PARTNER', ['monospace', 'utilitaire']), ('PEUGEOT', 'EXPERT', ['utilitaire']), ('PEUGEOT', 'BOXER', ['utilitaire']),
    ('PEUGEOT', 'BIPPER', ['utilitaire']), ('CITROEN', 'BERLINGO', ['monospace', 'utilitaire']), ('CITROEN', 'JUMPY', ['utilitaire']),
    ('CITROEN', 'JUMPER', ['utilitaire']), ('CITROEN', 'NEMO', ['utilitaire']), ('CITROEN', 'SPACETOURER', ['utilitaire']),
    ('OPEL', 'COMBO', ['monospace', 'utilitaire']), ('OPEL', 'VIVARO', ['utilitaire']), ('OPEL', 'MOVANO', ['utilitaire']),
    ('FORD', 'TRANSIT', ['utilitaire']), ('FORD', 'TRANSIT CUSTOM', ['utilitaire']), ('FORD', 'TRANSIT CONNECT', ['monospace', 'utilitaire']),
    ('FORD', 'TRANSIT COURIER', ['utilitaire']), ('FORD', 'TOURNEO CONNECT', ['monospace']), ('FORD', 'RANGER', ['utilitaire']),
    ('FIAT', 'DUCATO', ['utilitaire']), ('FIAT', 'DOBLO', ['monospace', 'utilitaire']), ('FIAT', 'SCUDO', ['utilitaire']), ('FIAT', 'FIORINO', ['utilitaire']),
    ('VOLKSWAGEN', 'TRANSPORTER', ['utilitaire']), ('VOLKSWAGEN', 'MULTIVAN', ['utilitaire']), ('VOLKSWAGEN', 'CALIFORNIA', ['utilitaire']),
    ('VOLKSWAGEN', 'CRAFTER', ['utilitaire']), ('VOLKSWAGEN', 'CADDY', ['monospace', 'utilitaire']), ('VOLKSWAGEN', 'AMAROK', ['utilitaire']),
    ('MERCEDES', 'SPRINTER', ['utilitaire']), ('MERCEDES', 'VITO', ['utilitaire']), ('MERCEDES', 'CLASSE V', ['utilitaire']),
    ('MERCEDES', 'CITAN', ['monospace', 'utilitaire']), ('MERCEDES', 'CLASSE T', ['monospace']),
    ('NISSAN', 'PRIMASTAR', ['utilitaire']), ('NISSAN', 'INTERSTAR', ['utilitaire']), ('NISSAN', 'TOWNSTAR', ['monospace', 'utilitaire']),
    ('NISSAN', 'NV200', ['monospace', 'utilitaire']), ('NISSAN', 'NAVARA', ['utilitaire']), ('TOYOTA', 'PROACE', ['utilitaire']),
    ('TOYOTA', 'HILUX', ['utilitaire']), ('IVECO', 'DAILY', ['utilitaire']), ('DACIA', 'DOKKER', ['monospace', 'utilitaire']),
    ('ISUZU', 'D-MAX', ['utilitaire']), ('MITSUBISHI', 'L200', ['utilitaire']), ('MAXUS', 'DELIVER 9', ['utilitaire']), ('MAXUS', 'EDELIVER 3', ['utilitaire']),
]
ORDER = ['citadine', 'berline', 'suv', 'monospace', 'utilitaire']
# Catégories retenues par modèle : la plus fréquente d'abord (catégorie par défaut)
out = defaultdict(dict)
for b, ms in catalog.items():
    for m, cnt in ms.items():
        total = sum(cnt.values())
        kept = [c for c, n in cnt.most_common() if n / total >= MIN_SHARE]
        out[b][m] = kept
# Le complément manuel prime sur les fichiers (catégorie par défaut en premier)
for b, m, cats in MANUAL:
    out[b][m] = cats
out = {b: dict(sorted(ms.items())) for b, ms in sorted(out.items())}
total = sum(len(v) for v in out.values())
print(f'{len(out)} marques, {total} modèles', file=sys.stderr)

with open(os.path.join(ROOT, 'src/data/vehicles.json'), 'w') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'))

def q(s):
    return "'" + s.replace("'", "''") + "'"

with open(os.path.join(ROOT, 'supabase/vehicle_catalog.sql'), 'w') as f:
    f.write('-- Généré par scripts/build_vehicle_catalog.py : ne pas modifier à la main.\n')
    f.write('-- Sources : ADEME / UTAC (data.gouv.fr) + complément manuel. À exécuter après schema.sql.\n')
    f.write('delete from public.vehicle_catalog;\n')
    rows = [f'({q(b)},{q(m)},array[{",".join(q(c) for c in cs)}])' for b, ms in out.items() for m, cs in ms.items()]
    for i in range(0, len(rows), 500):
        f.write('insert into public.vehicle_catalog (brand, model, categories) values\n' + ',\n'.join(rows[i:i + 500]) + ';\n')
