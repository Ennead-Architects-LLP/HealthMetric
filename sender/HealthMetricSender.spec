# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['sender.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'requests',
        'github',
        'PyGithub',
        'json',
        'base64',
        'zipfile',
        'io',
        'datetime',
        'pathlib',
        'typing',
        'os',
        'sys',
        'time',
        'urllib3',
        'certifi',
        'charset_normalizer',
        'idna',
        'ssl',
        'http',
        'urllib',
        'urllib.parse',
        'urllib.request',
        'urllib.error'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'pandas'],
    win_no_prefer_redirects=False,
    win_private_assemblies=True,
    cipher=block_cipher,
    noarchive=True,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='HealthMetricSender',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='HealthMetricSender',
)
