# webstorm-minimal-tsserver-plugin

Minimal reporoduction repo to show differences in TS Server plugin handling in VSCode and Webstorm.

The writing of the plugin is based off this documentation: https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin.

## Setup

Everything is committed in the repo so no additional command needs to be run.

### Webstorm setup

#### TypeScript version

Open Settings > Languages & Frameworks > TypeScript and make sure TypeScript is loaded from `~/<path-to-your-project>/webstorm-minimal-tsserver-plugin/node_modules/typescript`

<img width="732" alt="image" src="https://github.com/user-attachments/assets/8f7ef9ba-be1e-4c31-ae6a-0bac42d85e6a" />

#### TypeScript debugging

Open Help > Diagnostic Tools > Debug Log Settings... and make sure it includes the line `com.intellij.lang.javascript.service.JSLanguageServiceQueue:trace`

<img width="537" alt="image" src="https://github.com/user-attachments/assets/bef8ea33-59c8-4caa-9f2c-6bf021853c52" />

Restart the TypeScript language service and hit "Reload from disk" on the repo root: the TypeScript debug log should appear at the root of the repo with the name `.log<ID>`

<img width="1071" alt="image" src="https://github.com/user-attachments/assets/0c794482-4153-44ee-b3ce-7a050158360c" />

### VSCode setup

#### TypeScript version

`cmd + shift + P` > TypesScript: Select TypeScript version... and make sure to select the workspace version

<img width="599" alt="image" src="https://github.com/user-attachments/assets/50f371c6-92d0-4441-a376-04dfa9d41a37" />

#### TypeScript debugging

Open the TypeScript logs by doing `cmd + shift + P` > TypeScript: Open TS Server logs

Note: TypeScript logging may not be enabled, this command should offer to turn on logging if you don't have it enabled

<img width="1211" alt="image" src="https://github.com/user-attachments/assets/b12c2d38-9e30-48ed-a6f3-bc13ea50d2b1" />

The logs should somewhere around `/Users/<user>/Library/Application Support/Code/logs/<id>/window3/exthost/vscode.typescript-language-features/tsserver-log-<log-id>/tsserver.log`: you can see the exact path by opening the TypeScript output and checking for the path in the logs.

<img width="1307" alt="image" src="https://github.com/user-attachments/assets/633ccecc-4eae-4fdf-a645-23310f6c0bf2" />

## Results

### Completion entry details

#### Goal

Add the custom suggestion `myCustomFunction3` to the completions list with details like its source. Upon accepting the suggestion, the corresponding import should be added.

#### Trigger

* Open `packages/my-package/main.ts`
* Place the cursor after `myCustomFunction` ([line 5](https://github.com/mfigard/webstorm-minimal-tsserver-plugin/blob/main/packages/my-package/main.ts#L5))
* Press `ctrl + space` on both Webstorm and VSCode

#### Plugin code
In `plugins/tsserver/src/index.js`:
* Adding an entry to the completions list: function `getCompletionsAtPosition` ([lines 18 to 49](https://github.com/mfigard/webstorm-minimal-tsserver-plugin/blob/main/plugins/tsserver/src/index.js#L18-L49))
* Adding details to the custom entry: function `getCompletionEntryDetails` ([lines 52 to 124](https://github.com/mfigard/webstorm-minimal-tsserver-plugin/blob/main/plugins/tsserver/src/index.js#L52-L124))

#### Observed behavior

VSCode (expected) | Webstorm
-|-
The suggestion should appear in the list the same way other suggestions do. When selecting it, the import defined in the plugin is added. | The custom entry `myCustomFunction3` is shown in the list but doesn't appear the same way as other suggestions, with "No documentation found" in the info panel. When selecting it, the import defined in the plugin is not added
<img width="656" alt="image" src="https://github.com/user-attachments/assets/6a4346a8-8d39-4a93-b8f8-26bdedcea237" /> | <img width="953" alt="image" src="https://github.com/user-attachments/assets/745175d3-5bb1-4519-a674-f59c56a3257f" />
<video src="https://github.com/user-attachments/assets/79d17dac-39fa-4019-b822-b892fc49e8a3"> | <video src="https://github.com/user-attachments/assets/26cf2503-43aa-4512-8e62-57ac7aa3640b">

#### Conclusion

The details added in `getCompletionEntryDetails` seem to not be taken into account, especially the following fields:
* `displayParts` showing the source of the function
* `codeActions` defining the import line to add when selecting the custom completions entry


### Custom code action commands

#### Goal

Add the custom quick fix "Add dependency for 'myCustomFunction3'" to the list of quick fixes. Upon selecting the custom quick fix, the function `applyCodeActionCommand` should be triggered with the name `installCustomPackage`, showing a log in the TS Server log.

#### Trigger

* Open `packages/my-package/main.ts`
* Place the cursor inside `"custom-package"` ([line 1](https://github.com/mfigard/webstorm-minimal-tsserver-plugin/blob/main/packages/my-package/main.ts#L1))
* Display the list of quick fixes:
  * On VSCode: press `cmd + .`
  * On Webstorm: press `opt + return`

#### Plugin code
In `plugins/tsserver/src/index.js`:
* Adding a custom quick fix for the TS error TS2307: function `getCodeFixesAtPosition` ([lines 155 to 176](https://github.com/mfigard/webstorm-minimal-tsserver-plugin/blob/main/plugins/tsserver/src/index.js#L155-L176))
* Applying the custom code action command: function `applyCodeActionCommand` ([lines 220 to 234](https://github.com/mfigard/webstorm-minimal-tsserver-plugin/blob/main/plugins/tsserver/src/index.js#L220-L234))

#### Observed behavior

VSCode (expected) | Webstorm
-|-
The custom quick fix appears in the list. When selecting it and looking at the logs, the function `applyCodeActionCommand` is triggered with the custom action name `installCustomPackage`. | The custom quick fix appears in the list. When selecting it and looking at the logs, only the function `getCodeFixesAtPosition` is triggered but no logs from `applyCodeActionCommand` are found.
<img width="690" alt="image" src="https://github.com/user-attachments/assets/9ca9f4ac-e2d0-4c0c-bddd-6b7f7132e8c0" />|<img width="752" alt="image" src="https://github.com/user-attachments/assets/5eac1871-f6eb-4214-9a4f-3f150a156d4a" />
<img width="922" alt="image" src="https://github.com/user-attachments/assets/e96f11ab-fe45-4977-bcf1-da95cf0d2d02" />|<img width="1017" alt="image" src="https://github.com/user-attachments/assets/523377ef-2fac-412a-9b7b-477babf8af85" />

#### Conclusion

The function `applyCodeActionCommand` seems to not be triggered on Webstorm, which prevents custom code action commands from being run.
