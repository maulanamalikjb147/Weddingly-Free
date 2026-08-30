import re

with open('app/components/MainContent.tsx', 'r') as f:
    content = f.read()

# Make sure Fragment is imported
if 'import { Fragment } from "react";' not in content:
    content = content.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect, Fragment } from "react";')

# Find the start of isOpen
is_open_start = content.find('{isOpen && (')

# Find the start of Slide 7
slide_7_start = content.find('{/* Slide 7 */}')

# The block to replace
block = content[is_open_start:slide_7_start]

# We need to extract the parts.
# Slide 1 (Ayat Alkitab)
slide_1_start = block.find('{/* Slide 1 */}')
slide_1_end = block.find('{/* Slide Bride & Groom (Slide 1.5) */}')
slide_1 = block[slide_1_start:slide_1_end]

# Slide Bride & Groom, Slide 2, Slide 3
mempelai_start = block.find('{/* Slide Bride & Groom (Slide 1.5) */}')
mempelai_end = block.find('{/* Slide 4 */}')
mempelai = block[mempelai_start:mempelai_end]

# Slide 4
slide_4_start = block.find('{/* Slide 4 */}')
slide_4_end = block.find('{/* Slide 5 */}')
slide_4 = block[slide_4_start:slide_4_end]

# Slide 5 and Slide 6
acara_start = block.find('{/* Slide 5 */}')
acara_end = block.find('{/* Gallery Section */}')
acara = block[acara_start:acara_end]

# Gallery and Gifts
galeri_start = block.find('{/* Gallery Section */}')
galeri_end = block.find('{/* Gifts Section */}')
galeri = block[galeri_start:galeri_end]

rekening_start = block.find('{/* Gifts Section */}')
rekening_end = len(block)
rekening = block[rekening_start:rekening_end]

cerita = slide_1 + slide_4

new_block = """{isOpen && (config.sectionOrder || ['cerita', 'mempelai', 'acara', 'galeri', 'rekening']).map(sectionKey => (
          <Fragment key={sectionKey}>
            {sectionKey === 'cerita' && (
              <>
                """ + cerita.strip() + """
              </>
            )}
            {sectionKey === 'mempelai' && (
              <>
                """ + mempelai.strip() + """
              </>
            )}
            {sectionKey === 'acara' && (
              <>
                """ + acara.strip() + """
              </>
            )}
            {sectionKey === 'galeri' && (
              <>
                """ + galeri.strip() + """
              </>
            )}
            {sectionKey === 'rekening' && (
              <>
                """ + rekening.strip() + """
              </>
            )}
          </Fragment>
        ))}
        {isOpen && (
          <>
            """

content = content[:is_open_start] + new_block + content[slide_7_start:]

with open('app/components/MainContent.tsx', 'w') as f:
    f.write(content)

