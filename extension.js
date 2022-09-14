const vscode = require("vscode");

// https://eslint.org/docs/latest/rules/no-irregular-whitespace#rule-details
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

function replaceIrregularWhitespaces(text, regex) {
  return text.replace(regex, " ");
}

function fixIndentation(text, indentationAmount) {
  return text
    .split("\n")
    .map((line) => `${" ".repeat(indentationAmount)}${line}`)
    .join("\n");
}

async function handleActiveTextDocumentChange(changeEvent, regex) {
  const clipboardText = await vscode.env.clipboard.readText();

  changeEvent.contentChanges.forEach((contentChange) => {
    const { document } = changeEvent;
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== document) {
      // Ignore change if a text document changes but is not in a currently active editor
      return;
    }

    if (
      contentChange.text.length >= 1 &&
      contentChange.text === clipboardText &&
      contentChange.text.match(regex)
    ) {
      console.log("Detected irregular whitespaces! Replacing...");

      let newText = replaceIrregularWhitespaces(contentChange.text, regex);
      if (!newText) {
        return;
      }
      newText = fixIndentation(newText, contentChange.range.start.character);

      const newLinesCount = contentChange.text.split("\n").length;
      const firstLine = document.lineAt(contentChange.range.start.line);
      const lastLine = document.lineAt(
        firstLine.range.start.line + (newLinesCount - 1)
      );
      const textRange = new vscode.Range(
        firstLine.range.start,
        lastLine.range.end
      );
      const validatedTextRange = document.validateRange(textRange);
      editor.edit((editorBuilder) =>
        editorBuilder.replace(validatedTextRange, newText)
      );
    }
  });
}

function activate(context) {
  console.log('Extension "paste-fix" is now active!');
  const irregularWhitespacesRegex = new RegExp(
    `[${IRREGULAR_WHITESPACES.join("")}]`,
    "g"
  );

  // TODO: Add a command so that the user can run this on demand, instead of running only when pasting content.
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((changeEvent) =>
      handleActiveTextDocumentChange(changeEvent, irregularWhitespacesRegex)
    )
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
