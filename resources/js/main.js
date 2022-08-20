Neutralino.init();

var pkg = {
  title: null,
  name: null,
  dir: null,
  img: null,
  imgext: null,
  desc: null,
  valid: false
};

var index;
fetch("https://p2r3.com/spplice/packages")
  .then(res => res.json())
  .then(json => { index = json });

function searchIndex(key, val) {

  if(!val) return false;
  for(let i = 0; i < index.packages.length; i++) {
    if(index.packages[i][key].toLowerCase() === val.toLowerCase()) return true;
  }
  return false;

}

function sanitizeHTML(string) {
  return string.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
}

function setWarning(element, text) {

  const img = element.parentElement.getElementsByClassName("warning")[0];

  if(text) {
    img.style.opacity = 0.4;
    img.style.pointerEvents = "auto";
    img.title = text;
  } else {
    img.style.opacity = 0;
    img.style.pointerEvents = "none";
    img.title = "";
  }

}

function updateTitle() {

  const domTitle = document.getElementById("pkg-title");
  const domName = document.getElementById("pkg-name");

  domTitle.value = domTitle.value.replace(/[\\\n"]/g, "");

  if(domTitle.value.length > 25) {
    domTitle.value = domTitle.value.slice(0, -1);
  }

  if(domTitle.value.length > 4) {
    domTitle.style.color = "#faa81a";
    domTitle.style.borderColor = "#faa81a";
    pkg.title = domTitle.value;
  } else {
    domTitle.style.color = "#fff";
    domTitle.style.borderColor = "#fff";
    pkg.title = null;
  }

  if(searchIndex("title", pkg.title)) {
    domTitle.style.color = "#FF6461";
    domTitle.style.borderColor = "#FF6461";
    setWarning(domTitle, "This title is already in use on the public package repositiory. You can still use it locally, but it will not be valid for uploading.");
    pkg.title = null;
  } else setWarning(domTitle, null);

  domName.placeholder = domTitle.value.toLowerCase().replace(/[^A-Za-z0-9]/g, "-");
  while(domName.placeholder.indexOf("--") > -1) domName.placeholder = domName.placeholder.replace("--", "-");

  updateName();

  checkValidity();

}

function updateName() {

  const domName = document.getElementById("pkg-name");
  domName.value = domName.value.toLowerCase().replace(/ /g, "-").replace(/[^A-Za-z0-9-]/g, "");

  if(domName.value.length > 25) {
    domName.value = domName.value.slice(0, -1);
  }

  if(domName.value.length > 4 || (domName.value.length === 0 && domName.placeholder.length > 4)) {
    domName.style.color = "#faa81a";
    domName.style.borderColor = "#faa81a";
    if(!domName.value.length) pkg.name = domName.placeholder;
    else pkg.name = domName.value;
  } else {
    domName.style.color = "#fff";
    domName.style.borderColor = "#fff";
    pkg.name = null;
  }

  if(searchIndex("name", pkg.name)) {
    domName.style.color = "#FF6461";
    domName.style.borderColor = "#FF6461";
    setWarning(domName, "This name is already in use on the public package repositiory. You can still use it locally, but it will not be valid for uploading.");
    pkg.title = null;
  } else setWarning(domName, null);

  checkValidity();

}

async function selectFolder() {

  const domDir = document.getElementById("pkg-dir");
  const dir = await Neutralino.os.showFolderDialog("Select package resources folder");

  if(!dir) return;

  let dirName = dir.split("/");
  dirName = dirName[dirName.length - 1].split("\\");
  dirName = dirName[dirName.length - 1];

  domDir.style.color = "#faa81a";
  domDir.style.borderColor = "#faa81a";
  domDir.innerHTML = dirName;

  pkg.dir = dir;
  checkValidity();

}

async function selectImage() {

  const domImg = document.getElementById("pkg-img");
  const filter = {
    filters: [{
      name: "Images",
      extensions: ["jpg", "jpeg", "png"]
    }]
  };
  const img = (await Neutralino.os.showOpenDialog("Select package thumbnail image", filter))[0];
  if(!img) return;
  const size = (await Neutralino.filesystem.getStats(img)).size;

  if(size > 51200) {
    Neutralino.os.showMessageBox(
      "Invalid file size",
      "File must be under 50 KB!",
      "OK",
      "ERROR"
    );
    return;
  }

  let fileName = img.split("/");
  fileName = fileName[fileName.length - 1].split("\\");
  fileName = fileName[fileName.length - 1];
  let fileExt = fileName.split(".");
  fileExt = fileExt[fileExt.length - 1];

  let matches = false;
  for(let i = 0; i < filter.extensions.length; i++) {
    if(fileExt == filter.extensions[i]) {
      matches = true;
      break;
    }
  }
  if(!matches) {
    Neutralino.os.showMessageBox(
      "Invalid file type",
      "File must be a JPEG or PNG image!",
      "OK",
      "ERROR"
    );
    return;
  }

  domImg.style.color = "#faa81a";
  domImg.style.borderColor = "#faa81a";
  domImg.innerHTML = fileName;

  pkg.img = img;
  pkg.imgext = fileExt;
  checkValidity();

}

function updateDescription() {

  const domDesc = document.getElementById("pkg-desc");

  if(domDesc.value.length >= 10) {
    domDesc.style.color = "#faa81a";
    domDesc.style.borderColor = "#faa81a";
    pkg.desc = sanitizeHTML(domDesc.value);
  } else {
    domDesc.style.color = "#fff";
    domDesc.style.borderColor = "#fff";
    pkg.desc = null;
  }

  checkValidity();

}

function checkValidity() {

  const domText = document.getElementById("pkg-create-text");

  if(pkg.title && pkg.name && pkg.dir && pkg.img && pkg.imgext && pkg.desc) {

    pkg.valid = true;

    domText.style.color = "#faa81a";
    domText.style.letterSpacing = "0.2rem";
    domText.style.cursor = "pointer";

  } else {

    pkg.valid = false;

    domText.style.color = "#000";
    domText.style.letterSpacing = "0";
    domText.style.cursor = "default";

  }

}

async function createPackage() {

  if(!pkg.valid) return;

  try {

    // Create temporary directories
    try { await Neutralino.filesystem.getStats(`${NL_PATH}/.tmp`) }
    catch (e) { await Neutralino.filesystem.createDirectory(`${NL_PATH}/.tmp`) }
    try { await Neutralino.filesystem.getStats(`${NL_PATH}/.tmp/${pkg.name}`) }
    catch (e) { await Neutralino.filesystem.createDirectory(`${NL_PATH}/.tmp/${pkg.name}`) }

    // Remove soundcache
    try { await Neutralino.filesystem.removeFile(`${pkg.dir}/maps/soundcache/_master.cache`) } catch(e) {}

    // Copy image, package resources directory
    await Neutralino.filesystem.copyFile(pkg.img, `${NL_PATH}/.tmp/${pkg.name}/${pkg.name}.${pkg.imgext}`);
    await Neutralino.os.execCommand(`tar -czf "${NL_PATH}/.tmp/${pkg.name}/${pkg.name}.sppkg" -C "${pkg.dir}" .`);

    // Write package manifest
    await Neutralino.filesystem.writeFile(`${NL_PATH}/.tmp/${pkg.name}/manifest.json`,
`{
  "title": "${pkg.title}",
  "name": "${pkg.name}",
  "file": "${pkg.name}.sppkg",
  "icon": "${pkg.name}.${pkg.imgext}",
  "description": "${pkg.desc}"
}`);

    // Create output archive
    await Neutralino.os.execCommand(`tar -czf "${NL_PATH}/${pkg.name}_spplice.tar.gz" -C "${NL_PATH}/.tmp" ${pkg.name}`);

    // Clean up
    await Neutralino.filesystem.removeFile(`${NL_PATH}/.tmp/${pkg.name}/${pkg.name}.${pkg.imgext}`);
    await Neutralino.filesystem.removeFile(`${NL_PATH}/.tmp/${pkg.name}/${pkg.name}.sppkg`);
    await Neutralino.filesystem.removeFile(`${NL_PATH}/.tmp/${pkg.name}/manifest.json`);
    try { await Neutralino.filesystem.removeDirectory(`${NL_PATH}/.tmp/${pkg.name}`) } catch(e) {}
    try { await Neutralino.filesystem.removeDirectory(`${NL_PATH}/.tmp`) } catch(e) {}

    Neutralino.os.showMessageBox(
      "Package created",
      `The package has been created successfully and saved to "${NL_PATH}/${pkg.name}_spplice.tar.gz"
\nTo install it locally, find the Spplice install directory and put this file in the "custom" folder.
\nFor publishing on the public Spplice package reposiory, contact p2r3@p2r3.com`,
      "OK",
      "INFO"
    );

  } catch (e) {

    Neutralino.os.showMessageBox(
      "Packaging error",
      "An error occurred while creating the package: " + JSON.stringify(e),
      "OK",
      "ERROR"
    );

  }

}

Neutralino.events.on("windowClose", function () {
  Neutralino.app.exit();
});
