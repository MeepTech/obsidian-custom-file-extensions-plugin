import { ButtonComponent, Modal, TAbstractFile, TextComponent } from 'obsidian';
import CustomFileExtensions from './main';

export class EditExtensionModal extends Modal {
  private _path: string;
  private _name: string;
  private _originalExtension: string;
  private _newExtension: string;

  constructor(
    private plugin: CustomFileExtensions,
    private target: TAbstractFile,
  ) {
    console.log("Opening modal")
    super(plugin.app);
    this.target ??= this.plugin.app.vault.getRoot();

    this._path = this.target.path.split("/").slice(0, -1).join("/");
    console.log(this._path);

    let lastPart = this.target.path
      .split("/")
      .last()!;
    this._name = lastPart.split(".")[0]!;
    console.log(this._name);

    let lastParts = lastPart?.split(".")!;
    this._originalExtension
      = this._newExtension
      = lastParts.length == 1 ? "" : lastParts.last()!;
    console.log(this._originalExtension);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.style.display = "flex";
    contentEl.style.flexDirection = "column";
    contentEl.style.alignItems = "center";

    const fileNameDisplay = contentEl.createEl("span");
    fileNameDisplay.style.flexGrow = "1";
    fileNameDisplay.style.marginRight = "10px";
    fileNameDisplay.style.fontWeight = "bold";
    fileNameDisplay.style.textAlign = "center";
    fileNameDisplay.innerHTML = this._buildFullPath();


    const formDiv = contentEl.createEl("div");
    formDiv.style.display = "flex";
    formDiv.style.alignItems = "center";

    const fileNameInput = new TextComponent(formDiv);
    fileNameInput.inputEl.style.flexGrow = "1";
    fileNameInput.inputEl.style.marginRight = "10px";

    fileNameInput.setValue(this._originalExtension);
    fileNameInput.inputEl.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this._submit();
      } else if (e.key === "Escape") {
        this.close();
      }
    });
    fileNameInput.onChange((value) => {
      this._newExtension = value.startsWith(".") ? value.slice(1) : value;
      fileNameDisplay.innerHTML = this._buildFullPath();
    });

    const submitButton = new ButtonComponent(formDiv);
    submitButton.setCta();
    submitButton.setButtonText("Rename");
    submitButton.onClick(() => (this._submit()));
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private async _submit() {
    this.close();
    let newPath = this._buildFullPath();

    await this.app.vault.rename(this.target, newPath);
  }

  private _buildFullPath(): string {
    return this._path + "/"
      + this._name
      + (!!this._newExtension ? "." : "")
      + this._newExtension;
  }
}

export default EditExtensionModal;