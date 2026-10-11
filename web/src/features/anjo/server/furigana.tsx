import "server-only";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import ReactMarkdown from "react-markdown";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import {
  type ReadingMap,
  readingSegments,
  rehypeReadings,
} from "../shared/utils/furigana";

let tokenizer: Tokenizer<IpadicFeatures> | undefined;
let tokenizerPromise: Promise<void> | undefined;
// Keep the large dictionary out of React's development Promise instrumentation.
function initializeTokenizer(): Promise<void> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise<void>((resolve, reject) => {
      const moduleRequire = createRequire(join(process.cwd(), "package.json"));
      const dicPath = join(
        dirname(moduleRequire.resolve("kuromoji/package.json")),
        "dict"
      );
      kuromoji.builder({ dicPath }).build((error, result) => {
        if (error) {
          reject(error);
          return;
        }
        tokenizer = result;
        resolve();
      });
    }).catch((error) => {
      tokenizerPromise = undefined;
      console.error("Anjo furigana dictionary could not be loaded");
      throw error;
    });
  }
  return tokenizerPromise;
}

export async function Furigana({ children }: { children: string }) {
  await initializeTokenizer().catch(() => undefined);
  if (!tokenizer) return <span>{children}</span>;
  const activeTokenizer = tokenizer;
  const segments = readingSegments(children, (text) => {
    try {
      return activeTokenizer.tokenize(text);
    } catch {
      console.error("Anjo furigana could not annotate a text segment");
      return [{ surface_form: text }];
    }
  });
  return (
    <span>
      {segments.map(({ text, reading }, index) =>
        reading ? (
          <ruby key={`${index}-${text}`}>
            {text}
            <rt>
              <span aria-hidden="true">{reading}</span>
            </rt>
          </ruby>
        ) : (
          text
        )
      )}
    </span>
  );
}

export async function getMarkdownReadings(
  markdown: string
): Promise<ReadingMap> {
  await initializeTokenizer();
  if (!tokenizer) return {};
  const activeTokenizer = tokenizer;
  const tree = unified().use(remarkParse).parse(markdown);
  const readings: ReadingMap = Object.create(null);
  visit(tree, "text", (node) => {
    readings[node.value] = readingSegments(node.value, (text) =>
      activeTokenizer.tokenize(text)
    );
  });
  return readings;
}

export async function AnjoMarkdown({ children }: { children: string }) {
  const readings = await getMarkdownReadings(children).catch(() => ({}));
  return (
    <ReactMarkdown skipHtml rehypePlugins={[rehypeReadings(readings)]}>
      {children}
    </ReactMarkdown>
  );
}
