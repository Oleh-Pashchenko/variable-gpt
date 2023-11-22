import OpenAI from 'openai';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let apiKey = vscode.workspace.getConfiguration('variable-gpt').get('apiKey') as string;

    if (!apiKey) {
        vscode.window.showErrorMessage('Please configure your OpenAI API key in the extension settings!');
        return;
    }

    const openAi = new OpenAI({ apiKey });

    let disposable = vscode.commands.registerCommand('variable-gpt.getVariableName', async function () {
        const input = await vscode.window.showInputBox({ prompt: 'Enter a context for the variable name' });
        if (!input) return;

        try {
            const chatCompletion = await openAi.chat.completions.create({
                messages: [{ role: 'user', content: `As a Senior Software Engineer, provide a comma-separated list of suitable variable names for the following description: ${input}` }],
                model: 'gpt-3.5-turbo',
            });

            const result = chatCompletion.choices[0].message.content?.trim();
            if (!result) {
                vscode.window.showErrorMessage('No response from AI model.');
                return;
            }

            let variableNames = result.split(',').map(name => name.trim());

            const name = await vscode.window.showQuickPick(variableNames, {
                placeHolder: 'Choose a variable name',
            });

            if (!name) return;

            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const position = editor.selection.active;
                editor.edit(editBuilder => {
                    editBuilder.insert(position, name);
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching variable names: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }
