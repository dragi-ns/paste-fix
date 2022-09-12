const vscode = require("vscode");
const { writeFile } = require("fs");

// https://eslint.org/docs/latest/rules/no-irregular-whitespace#rule-details
// TODO: Extract this into its own module
const IRREGULAR_WHITESPACES = [
  "\u000B", // Line Tabulation (\v) - <VT>
  "\u000C", // Form Feed (\f) - <FF>
  "\u00A0", // No-Break Space - <NBSP>
  "\u0085", // Next Line
  "\u1680", // Ogham Space Mark
  "\u180E", // Mongolian Vowel Separator - <MVS>
  "\ufeff", // Zero Width No-Break Space - <BOM>
  "\u2000", // En Quad
  "\u2001", // Em Quad
  "\u2002", // En Space - <ENSP>
  "\u2003", // Em Space - <EMSP>
  "\u2004", // Tree-Per-Em
  "\u2005", // Four-Per-Em
  "\u2006", // Six-Per-Em
  "\u2007", // Figure Space
  "\u2008", // Punctuation Space - <PUNCSP>
  "\u2009", // Thin Space
  "\u200A", // Hair Space
  "\u200B", // Zero Width Space - <ZWSP>
  "\u2028", // Line Separator
  "\u2029", // Paragraph Separator
  "\u202F", // Narrow No-Break Space
  "\u205f", // Medium Mathematical Space
  "\u3000", // Ideographic Space
];

function activate(context) {
  console.log('Extension "paste-fix" is now active!');

  // TODO: Add a command so that the user can run this on demand, instead of running only when pasting content.

  const irregularWhitespacesRegex = new RegExp(
    `[${IRREGULAR_WHITESPACES.join("")}]`,
    "g"
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (changeEvent) => {
      const clipboardText = await vscode.env.clipboard.readText();

      changeEvent.contentChanges.forEach((contentChange) => {
        if (
          contentChange.text.length >= 1 &&
          contentChange.text === clipboardText &&
          contentChange.text.match(irregularWhitespacesRegex)
        ) {
          console.log("Detected irregular whitespaces! Replacing...");

          const { document } = changeEvent;

          // TODO: Instead of replacing all text from the document, replace only the pasted (changed) part.
          let newText = document
            .getText()
            .replace(irregularWhitespacesRegex, " ");
          if (!newText) {
            return;
          }

          let editor = vscode.window.visibleTextEditors.find(
            (editor) => editor.document === document
          );
          if (editor) {
            // https://stackoverflow.com/questions/45203543/vs-code-extension-api-to-get-the-range-of-the-whole-text-of-a-document
            const firstLine = editor.document.lineAt(0);
            const lastLine = editor.document.lineAt(
              editor.document.lineCount - 1
            );
            const textRange = new vscode.Range(
              firstLine.range.start,
              lastLine.range.end
            );
            return editor.edit((editBuilder) =>
              editBuilder.replace(textRange, newText)
            );
          }

          writeFile(document.uri.fsPath, newText);
        }
      });
    })
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
