import os

def build():
    files = [
        'src/bridge/detectors.js',
        'src/bridge/actions/base-actions.js',
        'src/bridge/scrapers.js',
        'src/bridge/products/crm.js',
        'src/bridge/products/creator.js',
        'src/bridge/products/flow.js',
        'src/bridge/products/books.js',
        'src/bridge/products/generic.js',
        'src/bridge/main.js'
    ]

    output = '// Bridge script for Zoho Deluge IDE\n(function() {\n'

    for f in files:
        if not os.path.exists(f):
            print(f"Error: {f} not found")
            return

        with open(f, 'r') as infile:
            lines = infile.readlines()
            # simple transform: strip imports/exports
            clean_lines = []
            for line in lines:
                l = line.strip()
                if l.startswith('import '):
                    continue
                if l.startswith('export '):
                    line = line.replace('export ', '')
                clean_lines.append(line)
            output += "".join(clean_lines) + "\n"

    output += '})();\n'

    with open('bridge.js', 'w') as outfile:
        outfile.write(output)

    print("Build complete: bridge.js")

if __name__ == "__main__":
    build()
