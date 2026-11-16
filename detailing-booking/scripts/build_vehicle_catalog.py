"""Génère le catalogue marque → modèle → catégorie de véhicule.

Quatre catégories tarifaires : moto (hors catalogue), citadine, suv, utilitaire.

Sources officielles (data.gouv.fr, ADEME / UTAC) : fichiers « Car Labelling » des véhicules
particuliers commercialisés en France :
- éditions 2012, 2013, 2014 et courante : marque, modèle, Carrosserie -> catégorie ;
- édition 2011 (sans carrosserie) : noms des modèles encore vendus en 2011, classés par mots-clés.

Correspondance carrosserie -> catégorie :
- berline, break, coupé, cabriolet -> citadine ;
- TS terrains/chemins (SUV), monospace, combispace, minispace -> suv (gabarit comparable) ;
- minibus (fourgons immatriculés en voiture) -> utilitaire.

Complément manuel (MANUAL ci-dessous) : modèles 2000-2010 retirés avant 2011, modèles 2015-2025
absents des éditions disponibles (dont marques récentes et chinoises), et utilitaires immatriculés
en camionnette (genre CTTE), hors du champ de ces fichiers.

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
SKIP_BRANDS = {'DANGEL', 'DIJEAU CARROSSIER', 'THE LONDON TAXI COMPANY'}
SKIP_MODELS = {'TOUS MODELES', 'AUTRES MODELES', 'AUTRE FOCUS'}
MIN_SHARE = 0.12  # une catégorie représentant moins de 12 % des lignes d'un modèle est considérée comme du bruit

GAMME = {
    'ECONOMIQUE': 'eco', 'INFERIEURE': 'inf', 'MOY-INFER': 'moyinf', 'MOYENNE INFERIEURE': 'moyinf',
    'MOY-SUPER': 'moysup', 'MOYENNE SUPERIEURE': 'moysup', 'SUPERIEURE': 'sup', 'LUXE': 'luxe',
}


def category(carrosserie: str, gamme: str) -> str | None:
    c = carrosserie.strip().upper()
    if c == 'MINIBUS':
        return 'utilitaire'
    if c.startswith(('TS TERRAINS', 'MONOSPACE', 'COMBISP', 'MINISPACE')):
        return 'suv'
    if c in ('BERLINE', 'BREAK', 'COUPE', 'CABRIOLET'):
        return 'citadine'
    return None


# Classement par mots-clés des modèles de l'édition 2011 absents des éditions avec carrosserie
KW_UTIL = ('TRAFIC', 'MASTER', 'JUMPY', 'JUMPER', 'EXPERT', 'BOXER', 'TRANSIT', 'DUCATO', 'SCUDO', 'VITO', 'VIANO',
           'SPRINTER', 'TRANSPORTER', 'CARAVELLE', 'MULTIVAN', 'CALIFORNIA', 'CRAFTER', 'VIVARO', 'MOVANO',
           'INTERSTAR', 'PRIMASTAR', 'DAILY', 'HIACE', 'TAXI')
KW_SUV = ('ALLROAD', 'CAYENNE', 'CHEROKEE', 'PATRIOT', 'WRANGLER', 'NITRO', 'JOURNEY', 'FREELANDER', 'ACTYON', 'KYRON',
          'QASHQAI', 'ESCALADE', 'EX3', 'FX3', 'FX5', 'VOYAGER', 'PHEDRA', 'ULYSSE', 'MULTIPLA', 'IDEA', 'MATERIA',
          'TREVIS', 'MATRIX', 'IX20', 'MAZDA 5', 'ALTEA', 'SCENIC', 'FREETRACK', 'CEVENNES', 'PT CRUISER', 'CLASSE R',
          'CLASSE M', 'CLASSE G', 'GL', 'GLK')


def keyword_category(model: str) -> str:
    if any(k in model for k in KW_UTIL):
        return 'utilitaire'
    if any(model == k or model.startswith(k + ' ') or k in model for k in KW_SUV):
        return 'suv'
    return 'citadine'


def strip_generation(m: str) -> str:
    """« CLIO III » -> « CLIO », « GOLF VI » -> « GOLF », « ALFA 147 » -> « 147 », « MAZDA 3 » -> « 3 »."""
    m = re.sub(r' (II|III|IV|V|VI|VII)$', '', m)
    m = re.sub(r'^(ALFA|MAZDA) (?=\w)', '', m)
    return m


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

# Édition 2011 (format Excel, sans carrosserie)
xls = glob.glob(os.path.join(SRC, '**', 'BASE CL MAJ JUIN 2011.xls'), recursive=True)
extra_2011 = {}
if xls:
    import pandas as pd  # lecture .xls : pip install pandas xlrd
    df = pd.read_excel(xls[0])
    for b, m in set(zip(df['lib_mrq'].astype(str), df['lib_mod'].astype(str))):
        b = clean_brand(b)
        m = strip_generation(clean_model(b, m))
        if b in SKIP_BRANDS or m in SKIP_MODELS or not m:
            continue
        if m not in catalog.get(b, {}):
            extra_2011[(b, m)] = keyword_category(m)
    print(f'édition 2011 : {len(extra_2011)} modèles ajoutés', file=sys.stderr)

# Complément manuel : (marque, modèle, catégories). Anciens codes « berline » et « monospace »
# convertis plus bas en citadine et suv.
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
    # Modèles 2000-2010 retirés avant 2011
    ('PEUGEOT', '106', ['citadine']), ('PEUGEOT', '206', ['citadine']), ('PEUGEOT', '306', ['citadine']), ('PEUGEOT', '307', ['citadine']),
    ('PEUGEOT', '406', ['citadine']), ('PEUGEOT', '407', ['citadine']), ('PEUGEOT', '607', ['citadine']), ('PEUGEOT', '806', ['suv']),
    ('PEUGEOT', '1007', ['citadine']), ('RENAULT', 'VEL SATIS', ['citadine']), ('RENAULT', 'AVANTIME', ['suv']), ('RENAULT', 'SAFRANE', ['citadine']),
    ('RENAULT', 'GRAND SCENIC', ['suv']), ('CITROEN', 'SAXO', ['citadine']), ('CITROEN', 'XSARA', ['citadine']), ('CITROEN', 'XSARA PICASSO', ['suv']),
    ('CITROEN', 'XANTIA', ['citadine']), ('CITROEN', 'C2', ['citadine']), ('CITROEN', 'EVASION', ['suv']), ('CITROEN', 'C-CROSSER', ['suv']),
    ('VOLKSWAGEN', 'LUPO', ['citadine']), ('VOLKSWAGEN', 'FOX', ['citadine']), ('VOLKSWAGEN', 'BORA', ['citadine']), ('VOLKSWAGEN', 'NEW BEETLE', ['citadine']),
    ('FIAT', 'SEICENTO', ['citadine']), ('FIAT', 'PUNTO', ['citadine']), ('FIAT', 'STILO', ['citadine']), ('FIAT', 'BRAVO', ['citadine']),
    ('FIAT', 'CROMA', ['citadine']), ('FIAT', 'MULTIPLA', ['suv']), ('FIAT', 'ULYSSE', ['suv']), ('FIAT', 'SEDICI', ['suv']),
    ('FORD', 'FUSION', ['citadine']), ('FORD', 'KA', ['citadine']), ('FORD', 'MONDEO', ['citadine']), ('FORD', 'GALAXY', ['suv']),
    ('FORD', 'S-MAX', ['suv']), ('FORD', 'C-MAX', ['suv']), ('FORD', 'MAVERICK', ['suv']),
    ('OPEL', 'VECTRA', ['citadine']), ('OPEL', 'SIGNUM', ['citadine']), ('OPEL', 'TIGRA', ['citadine']), ('OPEL', 'ZAFIRA', ['suv']),
    ('OPEL', 'MERIVA', ['suv']), ('OPEL', 'FRONTERA', ['suv']), ('OPEL', 'AGILA', ['citadine']),
    ('TOYOTA', 'COROLLA VERSO', ['suv']), ('TOYOTA', 'AVENSIS', ['citadine']), ('TOYOTA', 'PREVIA', ['suv']), ('TOYOTA', 'LAND CRUISER', ['suv']),
    ('NISSAN', 'ALMERA', ['citadine']), ('NISSAN', 'PRIMERA', ['citadine']), ('NISSAN', 'X-TRAIL', ['suv']), ('NISSAN', 'TERRANO', ['suv']),
    ('NISSAN', 'PATROL', ['suv']), ('NISSAN', 'MURANO', ['suv']), ('NISSAN', 'PATHFINDER', ['suv']),
    ('HONDA', 'CIVIC', ['citadine']), ('HONDA', 'ACCORD', ['citadine']), ('HONDA', 'JAZZ', ['citadine']), ('HONDA', 'CR-V', ['suv']), ('HONDA', 'FR-V', ['suv']),
    ('SKODA', 'FABIA', ['citadine']), ('SKODA', 'OCTAVIA', ['citadine']), ('SKODA', 'SUPERB', ['citadine']), ('SKODA', 'ROOMSTER', ['suv']),
    ('SEAT', 'AROSA', ['citadine']), ('SEAT', 'CORDOBA', ['citadine']), ('SEAT', 'TOLEDO', ['citadine']), ('SEAT', 'ALHAMBRA', ['suv']),
    ('LANCIA', 'YPSILON', ['citadine']), ('LANCIA', 'MUSA', ['suv']), ('LANCIA', 'THESIS', ['citadine']), ('LANCIA', 'PHEDRA', ['suv']),
    ('ROVER', '25', ['citadine']), ('ROVER', '45', ['citadine']), ('ROVER', '75', ['citadine']), ('MG', 'ZR', ['citadine']), ('MG', 'ZS 2001', ['citadine']),
    ('SAAB', '9-3', ['citadine']), ('SAAB', '9-5', ['citadine']), ('DAEWOO', 'MATIZ', ['citadine']), ('DAEWOO', 'KALOS', ['citadine']),
    ('DAEWOO', 'LACETTI', ['citadine']), ('DAEWOO', 'NUBIRA', ['citadine']), ('DAEWOO', 'TACUMA', ['suv']), ('CHEVROLET', 'MATIZ', ['citadine']),
    ('CHEVROLET', 'AVEO', ['citadine']), ('CHEVROLET', 'CRUZE', ['citadine']), ('CHEVROLET', 'CAPTIVA', ['suv']), ('CHEVROLET', 'ORLANDO', ['suv']),
    ('MITSUBISHI', 'COLT', ['citadine']), ('MITSUBISHI', 'LANCER', ['citadine']), ('MITSUBISHI', 'PAJERO', ['suv']), ('MITSUBISHI', 'OUTLANDER', ['suv']),
    ('SUZUKI', 'GRAND VITARA', ['suv']), ('SUZUKI', 'JIMNY', ['suv']), ('SUZUKI', 'LIANA', ['citadine']), ('SUZUKI', 'WAGON R+', ['citadine']),
    ('HYUNDAI', 'GETZ', ['citadine']), ('HYUNDAI', 'ACCENT', ['citadine']), ('HYUNDAI', 'SANTA FE', ['suv']), ('HYUNDAI', 'TERRACAN', ['suv']),
    ('KIA', 'PICANTO', ['citadine']), ('KIA', 'RIO', ['citadine']), ('KIA', 'SORENTO', ['suv']), ('KIA', 'CARENS', ['suv']), ('KIA', 'CARNIVAL', ['suv']),
    ('SMART', 'FORFOUR', ['citadine']), ('SMART', 'ROADSTER', ['citadine']), ('CHRYSLER', 'PT CRUISER', ['citadine']), ('CHRYSLER', 'GRAND VOYAGER', ['suv']),
    ('VOLVO', 'S40', ['citadine']), ('VOLVO', 'V50', ['citadine']), ('VOLVO', 'S80', ['citadine']), ('VOLVO', 'V70', ['citadine']), ('VOLVO', 'XC90', ['suv']),
    ('LAND ROVER', 'DEFENDER', ['suv']), ('LAND ROVER', 'DISCOVERY', ['suv']), ('JEEP', 'GRAND CHEROKEE', ['suv']), ('JEEP', 'COMMANDER', ['suv']),
    ('PORSCHE', 'CAYENNE', ['suv']), ('AUDI', 'A2', ['citadine']), ('AUDI', 'ALLROAD', ['suv']),
    # Marques et modèles récents (2015-2025), dont constructeurs chinois commercialisés en France
    ('ALPINE', 'A110', ['citadine']), ('ALPINE', 'A290', ['citadine']), ('RENAULT', '5 E-TECH', ['citadine']), ('RENAULT', '4 E-TECH', ['suv']),
    ('RENAULT', 'TWINGO E-TECH', ['citadine']), ('DS', 'DS 4', ['citadine']), ('DS', 'N°4', ['citadine']), ('DS', 'N°8', ['suv']),
    ('PEUGEOT', 'E-208', ['citadine']), ('PEUGEOT', 'E-2008', ['suv']), ('PEUGEOT', 'E-3008', ['suv']), ('PEUGEOT', 'E-5008', ['suv']),
    ('CITROEN', 'E-C3', ['citadine']), ('CITROEN', 'C3 2024', ['citadine']), ('FIAT', 'GRANDE PANDA', ['citadine']), ('LANCIA', 'YPSILON 2024', ['citadine']),
    ('HYUNDAI', 'INSTER', ['citadine']), ('KIA', 'EV3', ['suv']), ('KIA', 'EV4', ['citadine']), ('KIA', 'EV5', ['suv']),
    ('VOLKSWAGEN', 'ID.7', ['citadine']), ('VOLKSWAGEN', 'ID.2', ['citadine']), ('SKODA', 'ELROQ', ['suv']), ('CUPRA', 'TERRAMAR', ['suv']),
    ('MINI', 'ACEMAN', ['suv']), ('MINI', 'COUNTRYMAN', ['suv']), ('TOYOTA', 'C-HR+', ['suv']), ('LEXUS', 'LBX', ['suv']), ('LEXUS', 'UX', ['suv']),
    ('LEXUS', 'NX', ['suv']), ('LEXUS', 'RX', ['suv']), ('MAZDA', 'CX-30', ['suv']), ('MAZDA', 'CX-60', ['suv']), ('MAZDA', 'CX-80', ['suv']),
    ('MAZDA', 'MX-30', ['suv']), ('SUZUKI', 'E VITARA', ['suv']), ('SUZUKI', 'SWACE', ['citadine']), ('HONDA', 'E:NY1', ['suv']), ('HONDA', 'ZR-V', ['suv']),
    ('HONDA', 'HR-V', ['suv']), ('HONDA', 'E', ['citadine']), ('NISSAN', 'JUKE', ['suv']), ('NISSAN', 'MICRA', ['citadine']), ('NISSAN', 'LEAF', ['citadine']),
    ('JEEP', 'COMPASS', ['suv']), ('JEEP', 'RENEGADE', ['suv']), ('INEOS', 'GRENADIER', ['suv']), ('LOTUS', 'ELETRE', ['suv']), ('LOTUS', 'EMIRA', ['citadine']),
    ('POLESTAR', '3', ['suv']), ('POLESTAR', '4', ['suv']), ('FISKER', 'OCEAN', ['suv']), ('VINFAST', 'VF 6', ['suv']), ('VINFAST', 'VF 8', ['suv']),
    ('BYD', 'DOLPHIN SURF', ['citadine']), ('BYD', 'ATTO 2', ['suv']), ('BYD', 'SEAL U', ['suv']), ('BYD', 'SEALION 7', ['suv']), ('BYD', 'TANG', ['suv']),
    ('BYD', 'HAN', ['citadine']), ('BYD', 'SEAL 6', ['citadine']),
    ('MG', 'MG5', ['citadine']), ('MG', 'MARVEL R', ['suv']), ('MG', 'CYBERSTER', ['citadine']), ('MG', 'MGS5', ['suv']), ('MG', 'MGS6', ['suv']),
    ('LYNK & CO', '02', ['suv']), ('LYNK & CO', '08', ['suv']), ('LEAPMOTOR', 'T03', ['citadine']), ('LEAPMOTOR', 'C10', ['suv']),
    ('LEAPMOTOR', 'B10', ['suv']), ('XPENG', 'G6', ['suv']), ('XPENG', 'G9', ['suv']), ('XPENG', 'P7', ['citadine']),
    ('AIWAYS', 'U5', ['suv']), ('AIWAYS', 'U6', ['suv']), ('OMODA', '5', ['suv']), ('OMODA', 'E5', ['suv']), ('JAECOO', '7', ['suv']),
    ('ORA', '03', ['citadine']), ('WEY', 'COFFEE 01', ['suv']), ('SERES', '3', ['suv']), ('SERES', '5', ['suv']), ('DFSK', 'FENGON 5', ['suv']),
    ('DFSK', 'EC35', ['utilitaire']), ('DONGFENG', 'BOX', ['citadine']), ('VOYAH', 'FREE', ['suv']), ('VOYAH', 'DREAM', ['suv']),
    ('ZEEKR', '001', ['citadine']), ('ZEEKR', '7X', ['suv']), ('ZEEKR', 'X', ['suv']), ('HONGQI', 'E-HS9', ['suv']), ('CHERY', 'TIGGO 7', ['suv']),
    ('CHERY', 'TIGGO 8', ['suv']), ('SMART', '#3', ['suv']), ('SMART', '#5', ['suv']), ('FIREFLY', 'FIREFLY', ['citadine']),
    ('XEV', 'YOYO', ['citadine']), ('MOBILIZE', 'DUO', ['citadine']),
    # Marques passées entre les mailles (vendues en France depuis 2000)
    ('ABARTH', '500', ['citadine']), ('ABARTH', '595', ['citadine']), ('ABARTH', '695', ['citadine']), ('ABARTH', '500E', ['citadine']),
    ('ABARTH', '600E', ['suv']), ('ABARTH', '124 SPIDER', ['citadine']), ('ABARTH', 'PUNTO', ['citadine']), ('ABARTH', 'GRANDE PUNTO', ['citadine']),
    ('GENESIS', 'G70', ['citadine']), ('GENESIS', 'G80', ['citadine']), ('GENESIS', 'GV60', ['suv']), ('GENESIS', 'GV70', ['suv']), ('GENESIS', 'GV80', ['suv']),
    ('SSANGYONG', 'TIVOLI', ['suv']), ('SSANGYONG', 'XLV', ['suv']), ('SSANGYONG', 'TORRES', ['suv']), ('SSANGYONG', 'MUSSO', ['utilitaire']),
    ('GREAT WALL', 'STEED', ['utilitaire']), ('GREAT WALL', 'WINGLE', ['utilitaire']), ('GREAT WALL', 'HOVER', ['suv']),
    ('MAHINDRA', 'GOA', ['utilitaire']), ('MAHINDRA', 'XUV500', ['suv']), ('MAHINDRA', 'KUV100', ['citadine']),
    ('PROTON', 'GEN-2', ['citadine']), ('PROTON', 'PERSONA', ['citadine']), ('PROTON', 'SATRIA NEO', ['citadine']), ('PROTON', 'SAVVY', ['citadine']),
    ('HUMMER', 'H2', ['suv']), ('HUMMER', 'H3', ['suv']), ('RAM', '1500', ['utilitaire']), ('DODGE', 'RAM', ['utilitaire']),
    ('MCLAREN', '570S', ['citadine']), ('MCLAREN', '720S', ['citadine']), ('MCLAREN', '750S', ['citadine']), ('MCLAREN', 'ARTURA', ['citadine']), ('MCLAREN', 'GT', ['citadine']),
    ('BUGATTI', 'VEYRON', ['citadine']), ('BUGATTI', 'CHIRON', ['citadine']), ('SKYWELL', 'ET5', ['suv']),
    ('FORD', 'MUSTANG', ['citadine']), ('CHEVROLET', 'CAMARO', ['citadine']), ('CHEVROLET', 'CORVETTE', ['citadine']), ('CHEVROLET', 'SPARK', ['citadine']),
    ('TOYOTA', 'GR86', ['citadine']), ('TOYOTA', 'GT86', ['citadine']), ('TOYOTA', 'SUPRA', ['citadine']), ('TOYOTA', 'GR YARIS', ['citadine']),
    ('NISSAN', '350Z', ['citadine']), ('NISSAN', '370Z', ['citadine']), ('NISSAN', 'GT-R', ['citadine']), ('HONDA', 'S2000', ['citadine']), ('HONDA', 'NSX', ['citadine']),
    ('MG', 'ZS EV', ['suv']), ('MG', 'EHS', ['suv']), ('MG', 'MG4 XPOWER', ['citadine']),
    # Modèles 2015-2025 des grandes marques absents des éditions ADEME disponibles
    ('MERCEDES', 'GLC', ['suv']), ('MERCEDES', 'GLE', ['suv']), ('MERCEDES', 'GLS', ['suv']), ('MERCEDES', 'EQE', ['citadine']),
    ('MERCEDES', 'EQS', ['citadine']), ('MERCEDES', 'EQV', ['utilitaire']), ('MERCEDES', 'EQT', ['suv', 'utilitaire']),
    ('MERCEDES', 'AMG GT', ['citadine']), ('MERCEDES', 'CLASSE X', ['utilitaire']), ('MERCEDES', 'CLE', ['citadine']),
    ('BMW', 'X7', ['suv']), ('BMW', 'XM', ['suv']), ('BMW', 'IX2', ['suv']), ('BMW', 'I5', ['citadine']), ('BMW', 'I7', ['citadine']),
    ('BMW', 'Z3', ['citadine']), ('BMW', 'M2', ['citadine']), ('AUDI', 'Q8', ['suv']), ('AUDI', 'Q6 E-TRON', ['suv']),
    ('AUDI', 'Q8 E-TRON', ['suv']), ('AUDI', 'A6 E-TRON', ['citadine']), ('VOLKSWAGEN', 'TAYRON', ['suv']),
    ('PEUGEOT', '108', ['citadine']), ('PEUGEOT', 'E-308', ['citadine']), ('PEUGEOT', 'E-408', ['citadine']),
    ('PEUGEOT', 'E-RIFTER', ['suv', 'utilitaire']), ('PEUGEOT', 'E-PARTNER', ['utilitaire']), ('PEUGEOT', 'E-EXPERT', ['utilitaire']),
    ('RENAULT', 'ALASKAN', ['utilitaire']), ('CITROEN', 'C4 CACTUS', ['citadine']), ('CITROEN', 'C4 SPACETOURER', ['suv']),
    ('CITROEN', 'E-C4', ['citadine']), ('CITROEN', 'E-BERLINGO', ['suv', 'utilitaire']), ('CITROEN', 'E-JUMPY', ['utilitaire']),
    ('TOYOTA', 'PROACE VERSO', ['utilitaire']), ('TOYOTA', 'HIGHLANDER', ['suv']), ('TOYOTA', 'MIRAI', ['citadine']),
    ('TOYOTA', 'COROLLA CROSS', ['suv']), ('HYUNDAI', 'I10', ['citadine']), ('HYUNDAI', 'I20', ['citadine']), ('HYUNDAI', 'I30', ['citadine']),
    ('HYUNDAI', 'I40', ['citadine']), ('HYUNDAI', 'IX35', ['suv']), ('HYUNDAI', 'IONIQ', ['citadine']), ('HYUNDAI', 'NEXO', ['suv']),
    ('HYUNDAI', 'STARIA', ['utilitaire']), ('HYUNDAI', 'H-1', ['utilitaire']), ('KIA', 'E-NIRO', ['suv']), ('KIA', 'E-SOUL', ['citadine']),
    ('KIA', 'STINGER', ['citadine']), ('KIA', 'PV5', ['utilitaire']), ('NISSAN', 'E-NV200', ['suv', 'utilitaire']),
    ('FORD', 'TOURNEO CUSTOM', ['utilitaire']), ('FORD', 'E-TRANSIT', ['utilitaire']), ('FORD', 'CAPRI', ['suv']), ('FORD', 'EDGE', ['suv']),
    ('FORD', 'BRONCO', ['suv']), ('FORD', 'KA+', ['citadine']), ('OPEL', 'ZAFIRA LIFE', ['utilitaire']), ('FIAT', '500E', ['citadine']),
    ('FIAT', 'E-DUCATO', ['utilitaire']), ('FIAT', 'E-DOBLO', ['suv', 'utilitaire']), ('FIAT', 'TALENTO', ['utilitaire']),
    ('FIAT', 'FULLBACK', ['utilitaire']), ('FIAT', 'QUBO', ['suv', 'utilitaire']), ('VOLVO', 'EX40', ['suv']), ('VOLVO', 'EC40', ['suv']),
    ('VOLVO', 'EX90', ['suv']), ('VOLVO', 'C40', ['suv']), ('VOLVO', 'V90', ['citadine']), ('VOLVO', 'S90', ['citadine']),
    ('MAZDA', 'CX-3', ['suv']), ('SUZUKI', 'ACROSS', ['suv']), ('SUZUKI', 'BALENO', ['citadine']), ('JEEP', 'GLADIATOR', ['utilitaire']),
    ('LAND ROVER', 'RANGE ROVER VELAR', ['suv']), ('LAND ROVER', 'DISCOVERY SPORT', ['suv']), ('JAGUAR', 'E-PACE', ['suv']),
    ('JAGUAR', 'F-PACE', ['suv']), ('JAGUAR', 'I-PACE', ['suv']), ('JAGUAR', 'XE', ['citadine']), ('MINI', 'COOPER', ['citadine']),
    ('MINI', 'PACEMAN', ['suv']), ('LEXUS', 'ES', ['citadine']), ('LEXUS', 'RZ', ['suv']), ('LEXUS', 'LC', ['citadine']),
    ('LEXUS', 'LM', ['utilitaire']), ('ALFA ROMEO', 'TONALE', ['suv']), ('ALFA ROMEO', 'JUNIOR', ['suv']),
    ('MITSUBISHI', 'ECLIPSE CROSS', ['suv']), ('SUBARU', 'OUTBACK', ['suv']), ('SUBARU', 'CROSSTREK', ['suv']),
    # Petits utilitaires et véhicules de livraison
    ('MAN', 'TGE', ['utilitaire']), ('RENAULT TRUCKS', 'MASTER', ['utilitaire']), ('PIAGGIO', 'PORTER', ['utilitaire']), ('PIAGGIO', 'APE', ['utilitaire']),
    ('GOUPIL', 'G4', ['utilitaire']), ('GOUPIL', 'G5', ['utilitaire']), ('GOUPIL', 'G6', ['utilitaire']),
    # Voitures sans permis, très répandues en France
    ('AIXAM', 'CITY', ['citadine']), ('AIXAM', 'COUPE', ['citadine']), ('AIXAM', 'CROSSOVER', ['citadine']), ('AIXAM', 'MINAUTO', ['citadine']),
    ('LIGIER', 'JS50', ['citadine']), ('LIGIER', 'JS60', ['citadine']), ('LIGIER', 'MYLI', ['citadine']), ('MICROCAR', 'M.GO', ['citadine']),
    ('CHATENET', 'CH46', ['citadine']), ('CITROEN', 'AMI', ['citadine']), ('MICROLINO', 'MICROLINO', ['citadine']),
    ('BELLIER', 'B8', ['citadine']), ('BELLIER', 'DIVANE', ['citadine']), ('BELLIER', 'OPALE', ['citadine']),
    ('CASALINI', 'M14', ['citadine']), ('CASALINI', 'M20', ['citadine']), ('LIGIER', 'JS50 ELEC', ['citadine']),
]
# Variantes de nom de marque saisies par les clients -> (marque du catalogue, préfixe ajouté au modèle)
ALIASES = {
    'MERCEDES-BENZ': ('MERCEDES', ''), 'MERCEDES BENZ': ('MERCEDES', ''), 'BENZ': ('MERCEDES', ''), 'MERCO': ('MERCEDES', ''),
    'VW': ('VOLKSWAGEN', ''), 'VOLKS': ('VOLKSWAGEN', ''), 'B.M.W.': ('BMW', ''), 'BMW ALPINA': ('BMW', ''),
    'ALFA': ('ALFA ROMEO', ''), 'ALFAROMEO': ('ALFA ROMEO', ''), 'LAND-ROVER': ('LAND ROVER', ''), 'LANDROVER': ('LAND ROVER', ''),
    'RANGE ROVER': ('LAND ROVER', 'RANGE ROVER'), 'RANGE': ('LAND ROVER', 'RANGE ROVER'), 'ROLLS ROYCE': ('ROLLS-ROYCE', ''), 'ROLLS': ('ROLLS-ROYCE', ''),
    'KGM': ('SSANGYONG', ''), 'SSANG YONG': ('SSANGYONG', ''), 'SSANG-YONG': ('SSANGYONG', ''), 'KG MOBILITY': ('SSANGYONG', ''),
    'DS AUTOMOBILES': ('DS', ''), 'CITROEN DS': ('DS', ''), 'MORRIS GARAGES': ('MG', ''), 'M.G.': ('MG', ''), 'MG MOTOR': ('MG', ''),
    'BYD AUTO': ('BYD', ''), 'LYNK AND CO': ('LYNK & CO', ''), 'LYNK&CO': ('LYNK & CO', ''), 'LYNK': ('LYNK & CO', ''),
    'GWM': ('GREAT WALL', ''), 'GREAT WALL MOTORS': ('GREAT WALL', ''), 'GWM ORA': ('ORA', ''), 'TESLA MOTORS': ('TESLA', ''),
    'MINI COOPER': ('MINI', ''), 'COOPER': ('MINI', ''), 'FIAT PROFESSIONAL': ('FIAT', ''), 'RENAULT TRUCK': ('RENAULT TRUCKS', ''),
    'CHEVY': ('CHEVROLET', ''), 'DAEWOO CHEVROLET': ('CHEVROLET', ''), 'ASTON': ('ASTON MARTIN', ''), 'LAMBO': ('LAMBORGHINI', ''),
    'VOLVO CARS': ('VOLVO', ''), 'TOYOTA GR': ('TOYOTA', ''), 'CUPRA SEAT': ('CUPRA', ''), 'SMART EQ': ('SMART', ''),
}

ORDER = ['citadine', 'suv', 'utilitaire']
TO4 = {'berline': 'citadine', 'monospace': 'suv'}
# Catégories retenues par modèle : la plus fréquente d'abord (catégorie par défaut)
out = defaultdict(dict)
for b, ms in catalog.items():
    for m, cnt in ms.items():
        total = sum(cnt.values())
        kept = [c for c, n in cnt.most_common() if n / total >= MIN_SHARE]
        out[b][m] = kept
for (b, m), c in extra_2011.items():
    out[b].setdefault(m, [c])
# Le complément manuel prime sur les fichiers (catégorie par défaut en premier)
for b, m, cats in MANUAL:
    conv = []
    for c in cats:
        c = TO4.get(c, c)
        if c not in conv:
            conv.append(c)
    out[b][m] = conv
out = {b: dict(sorted(ms.items())) for b, ms in sorted(out.items())}
total = sum(len(v) for v in out.values())
print(f'{len(out)} marques, {total} modèles', file=sys.stderr)

with open(os.path.join(ROOT, 'src/data/vehicles.json'), 'w') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
with open(os.path.join(ROOT, 'src/data/brand_aliases.json'), 'w') as f:
    json.dump({a: list(v) for a, v in sorted(ALIASES.items())}, f, ensure_ascii=False, separators=(',', ':'))

def q(s):
    return "'" + s.replace("'", "''") + "'"

with open(os.path.join(ROOT, 'supabase/vehicle_catalog.sql'), 'w') as f:
    f.write('-- Généré par scripts/build_vehicle_catalog.py : ne pas modifier à la main.\n')
    f.write('-- Sources : ADEME / UTAC (data.gouv.fr) + complément manuel. À exécuter après schema.sql.\n')
    f.write('delete from public.vehicle_catalog;\n')
    f.write('delete from public.vehicle_brand_alias;\n')
    f.write('insert into public.vehicle_brand_alias (alias, brand, model_prefix) values\n'
            + ',\n'.join(f'({q(a)},{q(b)},{q(px)})' for a, (b, px) in sorted(ALIASES.items())) + ';\n')
    rows = [f'({q(b)},{q(m)},array[{",".join(q(c) for c in cs)}])' for b, ms in out.items() for m, cs in ms.items()]
    for i in range(0, len(rows), 500):
        f.write('insert into public.vehicle_catalog (brand, model, categories) values\n' + ',\n'.join(rows[i:i + 500]) + ';\n')
