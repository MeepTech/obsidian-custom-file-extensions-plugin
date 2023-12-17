# Obsidian Custom File Extensions Plugin

This is a plugin for [Obsidian](https://obsidian.md) to allow associaton of file type extensions with different in-app views via settings.

## Configuration

File types are associated with Obsidian's 'view' types using the main *Confg* setting. This setting takes a single json object as a parseable string.

- Ex: "`{"markdown": ["", "txt", "html", "js", "css", "ts", "yaml", "md"]}`"

> This will assign the extensions: "", "txt", "html", "js", "css", "ts", and "yaml" to the view registered with the name `markdown`.

### Mobile Specific Settings
Mobile-specific settings can be enabled using the *Mobile Settings* toggle.

Setting the *Mobile Config* to empty/undefined/null will cause the mobile file-types list to default to the desktop file-types list. Case sensitivity defaults to false.

### Allow md Extension Override
The *Allow md Extension Override* toggle allows the user to override the default Obsidian behavior of assigning the `markdown` view to the `.md` extension. This setting is disabled by default to avoid confusion and unexpected behavior. When disabled, the `.md` extension will always be assigned to the `markdown` view and any attempt to assign it to another view will be ignored.

### Defaults

The default settings assign the following to Obsidian's `markdown` view:
``` 
  "", "txt", "html",
  "js", "css", "ts",
  "jsx", "tsx", "yaml",
  "yml", "sass", "scss",
  "tex", "json", "md"
```

## Editing File Extensions
To edit the extension of a file, right click the file in the file-tree view or open it's context-menu and select the *Edit Extension* option. This will open a modal where you can enter/modify *just* the file extension. A Preceding dot is optional. Pressing the *Enter* key or clicking *Rename* will rename the file with the new extension. Pressing the *Esc* key or clicking out of the modal will prevent any changes from being made.

## Extra Features and Info
For convenience and debugging purpouses; This plugin also provides: 
  - A list of all currently known view types and their associated file extensions for the current vault.
  - A list of all errors related to the current plugin configuration. 
This infomation can be found at the bottom of the plugin settings tab. 

## Compatibility and Debugging
The plugin should provide a pop up error message, as well as a consistent error message under the plugin settings tab; detailing any incompatibilities with the current configuration. Any errors in the settings tab indicate that a file extension specified in your configuration setting has not been set (any valid extensions settings are still applied). These errors along with the lists of current extension associations and view types should allow you to fine-tune support for other plugins that add new view types or try to take control of other extensions; such as the *Code Files* plugin.
You can also use the *Mobile Specific* settings to augment extension support for plugins that only work on desktop.

## Notes
- The `markdown` view is the default view Obsidian uses for "md" files. 
- The "md" extension cannot be modified currently using this plugin and will always be set to the `markdown` view.
- All entered extensions are case-insensitive.
- "" (empty string) is a valid extension and will be treated as a file with no extension.
- If left empty while enabled, the mobile config will default to the desktop config.
- The active profile (desktop vs mobile) is indicated with superscript text in the settings tab.
- Items in the views and extensions list under the settings tab can be copied to the clipboard by clicking on them.
- The plugin updates extensions in real-time whenever it detects a new valid config. This means you may see pop up errors while editing the config, but as long as there are no consistent errors in the settings tab when you are done editing the config then the plugin should be working as intended.
- The Allow md Extension Override toggle applies to both desktop and mobile settings (when enabled).

 