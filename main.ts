import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface CustomFileExtensionsSettings {
  additionalFileTypes: string;
  previousAdditionalFileTypes: object;
  currentValueIsInvalidJson: boolean;
}

const DEFAULT_SETTINGS: CustomFileExtensionsSettings = {
  additionalFileTypes: '{"markdown": ["", "txt", "html", "js", "css", "ts", "yaml"]}',
  previousAdditionalFileTypes: { markdown: ["", "txt", "html", "js", "css", "ts", "yaml"] },
  currentValueIsInvalidJson: false
}

export default class CustomFileExtensions extends Plugin {
	settings: CustomFileExtensionsSettings;

  async onload() {
    super.onload();
    await this.loadSettings();
    this.addSettingTab(new CustomFileExtensionsSettingTab(this.app, this));
    this.apply();
  }

  onunload() {
    this.revert();
  }
  
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
	async saveSettings() {
    await this.saveData(this.settings);
    this.revert();
    this.apply();
  }
  
  apply() {
    // apply new types:
    const views = JSON.parse(this.settings.additionalFileTypes);
    for (const view in views) {
      for (const fileType of views[view]) {
        this.registerExtensions([fileType], view);
      }
    }
  }

  revert() {
    for (const view of Object.values(this.settings.previousAdditionalFileTypes).flat()) {
      try {
        this.app.viewRegistry.unregisterExtensions([view]);
      } catch {
        console.log("ERROR");
      }
    }

    try {
      this.registerExtensions([".md"], 'markdown');
    } catch {}
  }
}

class CustomFileExtensionsSettingTab extends PluginSettingTab {
	plugin: CustomFileExtensions;

	constructor(app: App, plugin: CustomFileExtensions) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Custom File Extensions Settings'});

		new Setting(containerEl)
			.setName('Config')
			.setDesc("Valid entry is a JSON object with properties named after the desired view, containing the file types to assign to that view. EX: " + DEFAULT_SETTINGS.additionalFileTypes)
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.additionalFileTypes)
        .setValue(this.plugin.settings.additionalFileTypes)
        .onChange(async (value) => {
          try {
            JSON.parse(value);
            this.plugin.settings.currentValueIsInvalidJson = false;
          } catch {
            this.plugin.settings.currentValueIsInvalidJson = true;
            return;
          }

          this.plugin.settings.previousAdditionalFileTypes = JSON.parse(this.plugin.settings.additionalFileTypes);
					this.plugin.settings.additionalFileTypes = value;
					await this.plugin.saveSettings();
        }));
	}
}