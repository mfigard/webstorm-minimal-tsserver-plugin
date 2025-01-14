function init(modules) {
    const ts = modules.typescript;

    function create(info) {
        // Diagnostic logging
        info.project.projectService.logger.info(
            "I'm getting set up now! Check the log for this message."
        );

        // Set up decorator object
        const proxy = Object.create(null);
        for (let k of Object.keys(info.languageService)) {
            const x = info.languageService[k];
            proxy[k] = (...args) => x.apply(info.languageService, args);
        }

        // Overrides the completions list - used to add custom entries to the list
        proxy.getCompletionsAtPosition = (fileName, position, options) => {
            info.project.projectService.logger.info(
                'Inside getCompletionsAtPosition'
            );

            const prior = info.languageService.getCompletionsAtPosition(fileName, position, options);

            if (!prior) return;

            const oldLength = prior.entries.length;


            const updated = prior;

            updated.entries.push({
                name: 'myCustomFunction3',
                kind: 'const',
                kindModifiers: 'declare',
                sortText: 'myCustomFunction3',
                sourceDisplay: [
                    { text: 'custom-package', kind: 'text' },
                ],
            });

            const newLength = updated.entries.length;

            info.project.projectService.logger.info(
                `Added myCustomFunction3 to the completions list. Old entries length: ${oldLength}, new entries length: ${newLength}`
            );

            return updated;
        };

        // Overrides the completion details - used to add details to the custom entries we added in the completions list
        proxy.getCompletionEntryDetails = (
            fileName,
            position,
            entryName,
            formatOptions,
            source,
            preferences,
            data,
        ) => {
            info.project.projectService.logger.info(
                'Inside getCompletionEntryDetails'
            );

            const details = info.languageService.getCompletionEntryDetails(
                fileName,
                position,
                entryName,
                formatOptions,
                source,
                preferences,
                data?.exportMapKey ? data : undefined,
            );

            info.project.projectService.logger.info(
                `Details: ${details?.name ? details?.name : 'no details'}`,
            );

            if (!details) {
                info.project.projectService.logger.info(
                    `Added custom details for myCustomFunction3`
                );

                return {
                    name: 'myCustomFunction3',
                    kindModifiers: 'export',
                    kind: 'const',
                    displayParts: [
                        { text: 'custom-package', kind: 'localName' },
                    ],
                    documentation: [
                        { text: 'packages/custom-package/custom-package.ts' }
                    ],
                    codeActions: [
                        {
                            description: `Add import from 'custom-package'`,
                            changes: [
                                {
                                    fileName,
                                    textChanges: [
                                        {
                                            span: {
                                                start: 0,
                                                length: 0,
                                            },
                                            newText: `import { myCustomFunction3 } from 'custom-package';\n`,
                                        },
                                    ],
                                },
                            ],
                            commands: [],
                        },
                    ],
                    sourceDisplay: [
                        {
                            text: 'custom-package',
                            kind: 'text',
                        },
                    ],
                };
            }

            return details;
        };



        // Overrides the quick fixes list - used to add custom quick fixes to the list
        // Note: `errorCodes` is actually only one error code,
        // if there are multiple error codes for one piece of code
        // the function will run once per error code
        proxy.getCodeFixesAtPosition = (
            fileName,
            start,
            end,
            errorCodes,
            formatOptions,
            preferences,
        ) => {
            info.project.projectService.logger.info(
                'Inside getCodeFixesAtPosition'
            );

            const priorFixes = info.languageService.getCodeFixesAtPosition(
                fileName,
                start,
                end,
                errorCodes,
                formatOptions,
                preferences,
            );

            // TS error 2307: Cannot find module 'module-name' or its corresponding type declarations.
            // when encountering this error, we want to provide a custom quick fix to install the module
            if (errorCodes.includes(2307)) {
                const ts2307QuickFix = {
                    fixName: 'fixCannotFindModule', // standard name defined in node_modules/typescript/lib/typescript.js line 157685 - has to be used so Typescript recognizes the quick fix
                    description: `Add dependency for 'myCustomFunction3'`,
                    changes: [],
                    commands: [
                        {
                            file: fileName,
                            type: 'install package',
                            title: `Install package 'custom-package'`,
                            command: 'installCustomPackage',
                            arguments: {
                                packageToInstall: 'custom-package',
                                fileName,
                            },
                        },
                    ],
                };


                return [...priorFixes, ts2307QuickFix];
            }

            return priorFixes;
        };

        // Overrides the command action process - used to handle the custom action we added in the completion details
        proxy.applyCodeActionCommand = async (action) => {
            info.project.projectService.logger.info(
                'Inside applyCodeActionCommand'
            );

            const command = action.command;

            if (command === 'installCustomPackage') {
                info.project.projectService.logger.info(
                    'Inside custom command'
                );
            }

            return info.languageService.applyCodeActionCommand(action);
        };

        return proxy;
    }

    return { create };
}

module.exports = init;
