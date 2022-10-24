# Obsidian Custom File Extensions Plugin

This is a plugin for [Obsidian](https://obsidian.md) to allow associaton of file type extensions with different in-app views via settings.

## Configuration

Configuration is done though a single setting which takes a json object as a parseable string.

Ex: "`{"markdown": ["", "txt", "html", "js", "css", "ts", "yaml"]}`"

The above example will assign the extensions: "", "txt", "html", "js", "css", "ts", and "yaml" to the view registered with the name `markdown`.

### Defaults

The default settings assign the extensions: "", "txt", "html", "js", "css", "ts", "yaml" to Obsidian's `markdown` view.

### Notes
- The `markdown` view is the default view Obsidian uses for "md" files. 
- The "md" extension cannot be modified currently using this plugin and will always be set to the `markdown` view.
 