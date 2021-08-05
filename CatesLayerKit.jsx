/*
  CatesLayerKit.jsx for Adobe Illustrator
  Description: Script to batch rename selected items' parents with some options.

  June, 2021
  by Kirill Pereshitkin
  https://github.com/kirillperesh
  kirill.fasmer@gmail.com

  Special for Catherine Gaschenko

  If you've found this script helpful, you may say hi to Cate
  QIWI: https://qiwi.com/n/OWSYS230
  Paysera: LT95 3500 0100 1046 3168

  Tested with Adobe Illustrator CC 2020 (Win).
  This script is provided "as is" without warranty of any kind.
  Free to use, not for sale.

  Released under the MIT license.
  http://opensource.org/licenses/mit-license.php


  UPDATES
    v.1.0.1
    - fixed a bug that made AI crash if trying to select blocked layers (via 'Select unnamed' or 'Select dublicates' buttons)
*/

//@target illustrator

var _NAME = "Cate's Layer Kit",
    _VERSION = 'v.1.0.1';

function main() {
  if (documents.length == 0)
    {
      alert('No opened document detected', 'File error');
      return;
    }

  var _doc = app.activeDocument,
      _pageItems = _doc.pageItems
      _selection = _doc.selection,
      _selLen = _selection.length,
      _layers = _doc.layers,
      _lyrLen = _doc.layers.length,
      _newNameTitle = 'Enter a new name for ' + _selLen + ' items:',
      _replaceTitle = 'Change the name of ' + _selLen + ' items:',
      _unnamedLayers = getUnnamedLayers(),
      _unnamedLayersNames = getLayersNames(_unnamedLayers),
      _duplicateLayers = [],
      _duplicateLayersItems = [],
      _duplicateLayersNumber = getDuplicateLayersNumber(),
      _duplicateLayersNames = getLayersNames(_duplicateLayers),
      _emptyLayers = getEmptyLayers(_layers),
      _emptyLayersNames = getLayersNames(_emptyLayers),
      _nestedLayersNames = getNestedLayersNames();

  var mainWindow = new Window('dialog', _NAME + ' ' + _VERSION, undefined); // main window
      mainWindow.alignChildren = 'fill';

  var groupNewName = mainWindow.add('group', undefined); // new name string group
      groupNewName.orientation = 'column';
      groupNewName.alignChildren = 'fill';
  var newNameTitle = groupNewName.add('statictext', undefined);
      newNameTitle.text = _newNameTitle;
  var newNameInput = groupNewName.add('edittext');
      newNameInput.characters = 30;
      newNameInput.active = true;

  // var layersOnlyCheck = mainWindow.add('checkbox', undefined, 'Rename layers only'); // rename layers only checkbox
  //     layersOnlyCheck.helpTip = "When checked, the script will rename the first parent\n" +
  //                               "of an item if it's only a layer, not a group, etc.\n";
  //     layersOnlyCheck.value = true;
  var replaceCheck = mainWindow.add('checkbox', undefined, 'Find and replace all matches'); // find and replace checkbox
      replaceCheck.helpTip = 'Enter the part of the name you want to replace.\n' +
                             'E.g.: if you enter "MY", it will replace all\n' +
                             'the "MY" occurrences in selected names';
      replaceCheck.value = false;

  var groupReplace = mainWindow.add('group', undefined); // replacement string group
      groupReplace.orientation = 'column';
      groupReplace.alignChildren = 'fill';
      groupReplace.enabled = false;
  var replaceTitle = groupReplace.add('statictext', undefined, 'Search string:');
  var replaceInput = groupReplace.add('edittext');
      replaceInput.characters = 30;

  var autoNumberCheck = mainWindow.add('checkbox', undefined, 'Auto-numbering'); // auto-numbering checkbox
      autoNumberCheck.helpTip = 'Eg: name_1, name_2, etc.';
      autoNumberCheck.value = true;

  var groupAutoNumber = mainWindow.add('group'); // auto-numbering group
      groupAutoNumber.orientation = 'row';
      groupAutoNumber.alignChildren = ['fill', 'fill'];
  var startNumberTitle = groupAutoNumber.add('statictext', undefined, 'Start from:'); // start number
  var startNumberInput = groupAutoNumber.add('edittext', undefined, 1);
      startNumberInput.preferredSize.width = 125;
  var separatorTitle = groupAutoNumber.add('statictext', undefined, 'Separator:'); // separator
  var separatorInput = groupAutoNumber.add('edittext', undefined, '_');
      separatorInput.helpTip = 'E.g.: name_1, name_2, etc.';
      separatorInput.preferredSize.width = 125;

  replaceCheck.onClick = function () // toggle find & replace
    {
      if (replaceCheck.value)
        {
          groupReplace.enabled = true;
          newNameTitle.text = _replaceTitle;
          groupAutoNumber.enabled = false;
          autoNumberCheck.value = false;
        }
      else
        {
          groupReplace.enabled = false;
          newNameTitle.text = _newNameTitle;
        }
    }
  autoNumberCheck.onClick = function () // toggle auto-numbering
    {
      if (autoNumberCheck.value)
        {
          groupAutoNumber.enabled = true;
          groupReplace.enabled = false;
          replaceCheck.value = false;
        }
      else
        {
          groupAutoNumber.enabled = false;
        }
    }
  startNumberInput.onChange = function () { this.text = convertToNum(startNumberInput.text); }
  shiftInputNumValue(startNumberInput);

  var groupUnnamed = mainWindow.add('group'); // unnamed layers block
      groupUnnamed.orientation = 'row';
      groupUnnamed.alignChildren = 'fill';
  var unnamedCount = groupUnnamed.add('statictext', undefined, ('Unnamed layers:')); // number of unnamed layers
  var unnamedNumber = groupUnnamed.add('edittext', undefined, getLengthOrDash(_unnamedLayersNames.length), {readonly : true});
      unnamedNumber.preferredSize.width = 33;
  var btnShowUnnamed = groupUnnamed.add('button', undefined, 'Show unnamed'); // Show a list of layers named "Layer "
      btnShowUnnamed.helpTip = 'Show a list of layers named "Layer "';
  var btnSelectUnnamed = groupUnnamed.add('button', undefined, 'Select unnamed'); // Select all items of layers named "Layer "
      btnSelectUnnamed.helpTip = 'Select all items of layers named "Layer "';

  var groupDuplicate = mainWindow.add('group'); // duplicate layers block
      groupDuplicate.orientation = 'row';
      groupDuplicate.alignChildren = 'fill';
  var duplicateCount = groupDuplicate.add('statictext', undefined, ('Duplicate layers:')); // number of duplicated layers
  var duplicateNumber = groupDuplicate.add('edittext', undefined, getLengthOrDash(_duplicateLayersNames.length), {readonly : true, borderless : true});
      duplicateNumber.preferredSize.width = 33;
  var btnShowDuplicate = groupDuplicate.add('button', undefined, 'Show duplicates'); // Show a list of layers named similarly
      btnShowDuplicate.helpTip = 'Show a list of layers named similarly';
  var btnSelectDuplicate = groupDuplicate.add('button', undefined, 'Select duplicates'); // Select all items of layers named similarly
      btnSelectDuplicate.helpTip = 'Select all items of layers named similarly';

  var groupEmpty = mainWindow.add('group'); // empty layers block
      groupEmpty.orientation = 'row';
      groupEmpty.alignChildren = 'fill';
  var emptyCount = groupEmpty.add('statictext', undefined, ('Empty layers:')); // number of empty layers
  var emptyNumber = groupEmpty.add('edittext', undefined, getLengthOrDash(_emptyLayersNames.length), {readonly : true});
      emptyNumber.preferredSize.width = 33;
  var btnShowEmpty = groupEmpty.add('button', undefined, 'Show empty'); // Show a list of empty layers
      btnShowEmpty.helpTip = 'Show a list of empty layers';
  var btnDeleteEmpty = groupEmpty.add('button', undefined, 'Delete empty'); // Delete empty layers
      btnDeleteEmpty.helpTip = 'Delete empty layers';

  var groupNested = mainWindow.add('group'); // nested layers block
      groupNested.orientation = 'row';
      groupNested.alignChildren = 'fill';
  var nestedCount = groupNested.add('statictext', undefined, ('Nested layers:')); // number of layers with sublayers
  var nestedNumber = groupNested.add('edittext', undefined, getLengthOrDash(_nestedLayersNames.length), {readonly : true});
      nestedNumber.preferredSize.width = 33;
  var btnShowNested = groupNested.add('button', undefined, 'Show nested'); // Show a list of layers with sublayers
      btnShowNested.helpTip = 'Show a list of layers with sublayers';

  var groupBottomButtons = mainWindow.add('group'); // bottom buttons
      groupBottomButtons.orientation = 'row';
      groupBottomButtons.alignChildren = ['center','center'];
  var btnCancel = groupBottomButtons.add('button', undefined, 'Cancel'); // cancel
      btnCancel.helpTip = 'Press Esc to Close';
  var btnOK = groupBottomButtons.add('button', undefined, 'OK'); // OK
      btnOK.helpTip = 'Press Enter to Run';

  var groupCopyright = mainWindow.add('statictext', undefined, '\u00A9 by Kirill Pereshitkin special for Catherine Gaschenko'); // copyright
      groupCopyright.justify = 'center';
      groupCopyright.enabled = false;

  btnShowUnnamed.onClick = function()
    {
      showLayersNames(_unnamedLayersNames, 'Unnamed');
    }
  btnSelectUnnamed.onClick = function()
    {
      if (nothingToShowCheck(_unnamedLayersNames, 'Unnamed')){return};
      selectUnnamedLayers();
      mainWindow.close();
    }
  btnShowDuplicate.onClick = function()
    {
      showLayersNames(_duplicateLayersNames, 'Duplicating');
    }
  btnSelectDuplicate.onClick = function()
    {
      if (nothingToShowCheck(_duplicateLayersNames, 'Duplicating')){return};
      selectDuplicateLayers();
      mainWindow.close();
    }
  btnShowEmpty.onClick = function()
    {
      showLayersNames(_emptyLayersNames, 'Empty');
    }
  btnDeleteEmpty.onClick = function()
    {
      if (nothingToShowCheck(_emptyLayersNames, 'Empty')){return};
      var deletedNumber = 0;
      var msg = ' layers deleted:\n'
      for (var i = 0; i < _emptyLayers.length; i++)
        {
          _emptyLayers[i].remove();
          msg += (i+1) + ': ' + _emptyLayersNames[i] + '\n';
          deletedNumber++;
        }
      reopenPnl();
      refreshLayersCount();
      alert(deletedNumber + msg, 'Deleted successfully');
    }
  btnShowNested.onClick = function()
    {
      showLayersNames(_nestedLayersNames, 'Nested');
    }
  btnCancel.onClick = function() {mainWindow.close();}
  btnOK.onClick = function()
    {
      if (inputValidation())
        {
          renameFirstParentLayer();
        }
      reopenPnl();
      mainWindow.close();
    }

  function inputValidation()
    {
      if (_selLen < 2)
        {
          alert('Less than 2 objects selected\nNo layers were renamed', 'Selection error');
          return false;
        }
      if (!replaceInput.text && replaceCheck.value)
        {
          alert('No search string was provided\nNo layers were renamed', 'Input error');
          return false;
        }
      return true;
    }

  function renameFirstParentLayer()
    {
      var autoNumber = startNumberInput.text;
      var lastRenamedLayer;

      for (var i = 0; i < _selLen; i++)
        {
          var iObj = _selection[i];
          var iParentLayer = iObj.layer;
          if (iParentLayer == lastRenamedLayer) {continue;}
          if (replaceCheck.value)
            {
              iParentLayer.name = iParentLayer.name.replaceAll(replaceInput.text, newNameInput.text);
              continue;
            }
            iParentLayer.name = newNameInput.text;
          if (autoNumberCheck.value)
            {
              suffix = separatorInput.text + autoNumber;
              iParentLayer.name = (newNameInput.text) ? (newNameInput.text + suffix) : (suffix);
              autoNumber++;
            }
          lastRenamedLayer = iParentLayer;
        }
    }


  function getUnnamedLayers()
    {
      var unnamedLayers = [];
      for (var i = 0; i < _lyrLen; i++)
        {
          if (_layers[i].name.substring(0, 6) == 'Layer ')
            {
              unnamedLayers.push(_layers[i])
            }
        }
      return unnamedLayers;
    }

  function getLayersNames(layers)
    {
      var layersNames = [];
      for (var i = 0; i < layers.length; i++){layersNames.push(layers[i].name)}
      return layersNames;
    }

  function getDuplicateLayersNumber()
    {
      var duplicateLayersNumber = 0;
      var layersCount = {};
      for (var i = 0; i < _lyrLen; i++)
        {
          if (layersCount[_layers[i]] > 1) {continue;}
          layersCount[_layers[i]] = 1;
          for (var j = i + 1; j < _lyrLen; j++)
            {
              if (_layers[i].name == _layers[j].name)
                {
                  layersCount[_layers[i]] += 1;
                  _duplicateLayers.push(_layers[j]);
                  for (var k = 0; k < _layers[j].pageItems.length; k++){_duplicateLayersItems.push(_layers[j].pageItems[k]);}
                }
            }
          if (layersCount[_layers[i]] > 1)
            {
              duplicateLayersNumber += layersCount[_layers[i]];
              _duplicateLayers.push(_layers[i]);
              for (var k = 0; k < _layers[i].pageItems.length; k++){_duplicateLayersItems.push(_layers[i].pageItems[k]);}
            }
        }
      return duplicateLayersNumber;
    }

  function getEmptyLayers(layers)
    {
      var emptyLayers = [];
      function recSearch(layers)
        {
          for (var i = 0; i < layers.length; i++)
            {
              if (layers[i].layers.length){recSearch(layers[i].layers)}
              if (!layers[i].pageItems.length){emptyLayers.push(layers[i]);}
            }
        }
      recSearch(layers);
      return emptyLayers;
    }

  function getNestedLayersNames()
    {
      var nestedLayersNames = [];
      for (var i = 0; i < _lyrLen; i++)
        {
          if (_layers[i].layers.length){nestedLayersNames.push(_layers[i].name)}
        }
      return nestedLayersNames;
    }

  function deselectPageItems()
    {
      for (var i = 0; i < _pageItems.length; i++)
        {
          _pageItems[i].selected = false;
        }
    }

  function selectUnnamedLayers()
    {
      for (var i = 0; i < _pageItems.length; i++)
        {
          _pageItems[i].selected = false;
          for (var j = 0; j < _unnamedLayers.length; j++)
            {
              if (_unnamedLayers[j] == _pageItems[i].layer) {
                try {
                  _pageItems[i].selected = true;
                    }
                catch(err){alert('Unable to select ' + _pageItems[i].layer.name + ".\nProbable because it's blocked..")}
              }
            }
        }
    }
  function selectDuplicateLayers()
    {
      deselectPageItems();
      for (var i = 0; i < _duplicateLayersItems.length; i++)
        {
          try {
            _duplicateLayersItems[i].selected = true;
              }
          catch(err){alert('Unable to select ' + _duplicateLayersItems[i].layer.name + ".\nProbable because it's blocked..")}
        }
    }


  function nothingToShowCheck(layersNamesArray, layerName)
    {
      var lowlayerName = layerName.toLowerCase();
      if (!layersNamesArray.length)
        {
          alert("No " + lowlayerName + " layers found", 'Nothing to see here');
          return true;
        }
      return false;
    }

function showLayersNames(layersNamesArray, layerName)
  {
    if (nothingToShowCheck(layersNamesArray, layerName)){return};
    var msg = layerName + ' layers:\n\n'
    for (var i = 0; i < layersNamesArray.length; i++)
      {
        msg += (i+1) + ': ' + layersNamesArray[i] + '\n';
      }
    msg += '\nTotal: ' + layersNamesArray.length
      alert(msg, layerName)
  }

function getLengthOrDash(arrayLength){return (arrayLength > 0) ? arrayLength : '-';}

function refreshLayersCount()
  {
    _layers = _doc.layers;
    _lyrLen = _doc.layers.length;
    _unnamedLayers = getUnnamedLayers();
    _unnamedLayersNames = getLayersNames(_unnamedLayers);
    unnamedNumber.text = getLengthOrDash(_unnamedLayersNames.length);

    _duplicateLayers = [];
    _duplicateLayersItems = [];
    _duplicateLayersNumber = getDuplicateLayersNumber();
    _duplicateLayersNames = getLayersNames(_duplicateLayers);
    duplicateNumber.text = getLengthOrDash(_duplicateLayersNames.length);

    _emptyLayers = getEmptyLayers(_layers);
    _emptyLayersNames = getLayersNames(_emptyLayers);
    emptyNumber.text = getLengthOrDash(_emptyLayersNames.length);

    _nestedLayersNames = getNestedLayersNames();
    nestedNumber.text = getLengthOrDash(_nestedLayersNames.length);
  }

  function shiftInputNumValue(item)
    {
      item.addEventListener('keydown', function (kd) {
        var step;
        ScriptUI.environment.keyboardState['shiftKey'] ? step = 10 : step = 1;
        if (kd.keyName == 'Down') {
          this.text = Number(this.text) - step;
          kd.preventDefault();
        }
        if (kd.keyName == 'Up') {
          this.text = Number(this.text) + step;
          kd.preventDefault();
        }
      });
    }

  mainWindow.show();
}

function convertToNum(str, def)
  {
    // Remove unnecessary characters
    str = str.replace(/,/g, '.').replace(/[^\d.-]/g, '');
    // Remove duplicate Point
    str = str.split('.');
    str = str[0] ? str[0] + '.' + str.slice(1).join('') : '';
    // Remove duplicate Minus
    str = str.substr(0, 1) + str.substr(1).replace(/-/g, '');
    if (isNaN(str) || str.length == 0) return parseFloat(def);
    return parseFloat(str);
  }

function reopenPnl() { // Illustrator UI trick. Reopen layers panel for update names
  app.executeMenuCommand('AdobeLayerPalette1'); // close
  app.executeMenuCommand('AdobeLayerPalette1'); // open
}

String.prototype.replaceAll = function(search, replacement){return this.replace(new RegExp(search, 'g'), replacement);};

try {
  main();
} catch (e) {alert((e + '\n\nException caught\nContact the dev'), 'Unknown error');}