// Self-check for the "paste → auto-format" parser. Run: npm run check
import assert from 'node:assert/strict'
import { parsePastedStory } from '../src/lib/paste.ts'

// Full Hindi story: headline, sub-headline, labelled reporter, dateline, two paragraphs
const a = parsePastedStory(
  [
    'मिलावट पर सख्ती: जांच रिपोर्ट 14 दिन में',
    '',
    'अब नमूनों की रिपोर्ट जल्दी आएगी',
    '',
    'रिपोर्ट: राजेश कुमार',
    '',
    'पटना, 30 सितंबर (प्रहरी)— बिहार सरकार ने आज बड़ा फैसला लिया है। यह फैसला सभी ज़िलों में लागू होगा।',
    '',
    'दूसरे पैराग्राफ में और विवरण दिया गया है। अधिकारियों ने कहा कि काम जल्द शुरू होगा।',
  ].join('\n'),
)
assert.equal(a.title, 'मिलावट पर सख्ती: जांच रिपोर्ट 14 दिन में')
assert.equal(a.subheadline, 'अब नमूनों की रिपोर्ट जल्दी आएगी')
assert.equal(a.reporter, 'राजेश कुमार')
assert.equal(a.location, 'पटना')
assert.equal(a.paragraphs.length, 2)

// Labelled lines win; values the editor already typed are kept; hard-wrapped lines inside a paragraph are joined
const b = parsePastedStory('Headline: Big news\nBy: Sita Devi\n\nFirst line of the story\nwraps here.\n\nSecond paragraph ends here.', { title: 'Mine' })
assert.equal(b.title, undefined)
assert.equal(b.reporter, 'Sita Devi')
assert.deepEqual(b.paragraphs, ['First line of the story wraps here.', 'Second paragraph ends here.'])

// WhatsApp style (no blank lines): every line is a paragraph, and a plain sentence is never taken as a headline
const c = parsePastedStory('बिहार में आज बारिश हुई।\nकई ज़िलों में जलभराव।')
assert.equal(c.title, undefined)
assert.equal(c.paragraphs.length, 2)

// Trailing "— name" byline
const d = parsePastedStory('शीर्षक: सड़क बनी\n\nगांव की सड़क आखिरकार बन गई है और लोग खुश हैं।\n\n— अनिल शर्मा')
assert.equal(d.reporter, 'अनिल शर्मा')
assert.equal(d.paragraphs.length, 1)

assert.deepEqual(parsePastedStory('  \n ').paragraphs, [])
console.log('paste checks passed')
