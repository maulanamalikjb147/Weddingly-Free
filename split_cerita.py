with open('app/components/MainContent.tsx', 'r') as f:
    content = f.read()

# Replace the array
content = content.replace("['cerita', 'mempelai', 'acara', 'galeri', 'rekening']", "['ayat', 'timeline', 'mempelai', 'acara', 'galeri', 'rekening']")

# Replace {sectionKey === 'cerita' && ( ... )} with {sectionKey === 'ayat' && (...Slide 1...)} and {sectionKey === 'timeline' && (...Slide 4...)}
# We can find the exact text for {sectionKey === 'cerita' && (
# and split it.
cerita_block = content.find("{sectionKey === 'cerita' && (")
mempelai_block = content.find("{sectionKey === 'mempelai' && (")

cerita_content = content[cerita_block:mempelai_block]

slide_1_start = cerita_content.find("{/* Slide 1 */}")
slide_4_start = cerita_content.find("{/* Slide 4 */}")

slide_1_content = cerita_content[slide_1_start:slide_4_start].strip()

# Slide 4 ends with `</>` and `)}`
slide_4_content = cerita_content[slide_4_start:cerita_content.rfind('</>')].strip()

new_ayat_timeline = """{sectionKey === 'ayat' && (
              <>
                """ + slide_1_content + """
              </>
            )}

            {sectionKey === 'timeline' && (
              <>
                """ + slide_4_content + """
              </>
            )}
"""

content = content[:cerita_block] + new_ayat_timeline + content[mempelai_block:]

with open('app/components/MainContent.tsx', 'w') as f:
    f.write(content)

