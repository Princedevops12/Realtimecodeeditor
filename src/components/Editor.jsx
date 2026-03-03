import React, { useEffect, useRef } from 'react';
import { Annotation, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completeFromList,
  completionKeymap,
  snippetCompletion,
} from '@codemirror/autocomplete';
import { HighlightStyle, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { lintGutter, linter } from '@codemirror/lint';
import { tags } from '@lezer/highlight';

const remoteChange = Annotation.define();

const keywordCompletions = [
  ...['const', 'let', 'var', 'if', 'else', 'for', 'while', 'switch', 'case', 'return', 'try', 'catch', 'finally', 'async', 'await', 'class', 'import', 'export', 'from', 'new'].map((label) => ({
    label,
    type: 'keyword',
  })),
  snippetCompletion('function ${name}(${params}) {\n\t${}\n}', {
    label: 'function',
    detail: 'snippet',
    type: 'keyword',
  }),
  snippetCompletion('if (${condition}) {\n\t${}\n}', {
    label: 'if',
    detail: 'snippet',
    type: 'keyword',
  }),
  snippetCompletion('for (let ${i} = 0; ${i} < ${limit}; ${i}++) {\n\t${}\n}', {
    label: 'for',
    detail: 'snippet',
    type: 'keyword',
  }),
  { label: 'console.log', type: 'function', apply: 'console.log()' },
  { label: 'setTimeout', type: 'function' },
  { label: 'setInterval', type: 'function' },
  { label: 'Array', type: 'class' },
  { label: 'Object', type: 'class' },
  { label: 'String', type: 'class' },
];

const editorHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#ff79c6' },
  { tag: [tags.variableName, tags.propertyName], color: '#8be9fd' },
  { tag: [tags.definition(tags.variableName), tags.name], color: '#50fa7b' },
  { tag: [tags.string, tags.special(tags.string)], color: '#f1fa8c' },
  { tag: [tags.number, tags.bool], color: '#bd93f9' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: '#6272a4' },
  { tag: tags.function(tags.variableName), color: '#50fa7b' },
  { tag: tags.operator, color: '#ff79c6' },
]);

const javascriptSyntaxLinter = linter((view) => {
  const diagnostics = [];
  const tree = syntaxTree(view.state);

  tree.iterate({
    enter: (node) => {
      if (!node.type.isError) return;
      diagnostics.push({
        from: node.from,
        to: Math.max(node.to, node.from + 1),
        severity: 'error',
        source: 'SyntaxError',
        message: 'SyntaxError: invalid or incomplete JavaScript syntax.',
      });
    },
  });

  return diagnostics;
});

const Editor = ({ onCodeChange, incomingCode }) => {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const onCodeChangeRef = useRef(onCodeChange);

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const state = EditorState.create({
      doc: '// Start coding here...',
      extensions: [
        basicSetup,
        javascript(),
        closeBrackets(),
        keymap.of(closeBracketsKeymap),
        keymap.of(completionKeymap),
        autocompletion({
          activateOnTyping: true,
          icons: true,
          override: [completeFromList(keywordCompletions)],
        }),
        syntaxHighlighting(editorHighlightStyle),
        lintGutter(),
        javascriptSyntaxLinter,
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const isRemote = update.transactions.some((tr) => tr.annotation(remoteChange));
          if (isRemote) return;
          const code = update.state.doc.toString();
          onCodeChangeRef.current?.(code);
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof incomingCode !== 'string') return;
    const view = viewRef.current;
    if (!view) return;

    const currentCode = view.state.doc.toString();
    if (currentCode === incomingCode) return;

    view.dispatch({
      changes: { from: 0, to: currentCode.length, insert: incomingCode },
      annotations: remoteChange.of(true),
    });
  }, [incomingCode]);

  return <div ref={containerRef} className="editorcontainer" />;
};

export default Editor;
