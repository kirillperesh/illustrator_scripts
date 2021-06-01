/*
  RenameFirstParent.jsx for Adobe Illustrator
  Description: Script to batch rename selected items' parents with some options.

  May, 2021
  by Kirill Pereshitkin
  https://github.com/kirillperesh

  Special for Catherine Gaschenko

  If you've found this script helpful, you may say hi to my girlfriend
  -------------------------------------------

  Versions:
  1.0 Initial version

  NOTICE:
  Tested with Adobe Illustrator CC 2021 (Win).
  This script is provided "as is" without warranty of any kind.
  Free to use, not for sale.

  UI is somewhat based on RenameItems.jsx by Sergey Osokin, email: hi@sergosokin.ru
  Released under the MIT license.
  http://opensource.org/licenses/mit-license.php
*/

//@target illustrator

var _NAME = 'Rename First Parent',
    _VERSION = 'v.1.0';

function main() {
  if (documents.length == 0)
    {
      alert('Error\nNo opened document detected');
      return;
    }

  var _doc = app.activeDocument,
      _selection = _doc.selection,
      _selLen = _selection.length;
      _newNameTitle = 'Enter a new name for ' + _selLen + ' layers:';
      _replaceTitle = 'Change the name of ' + _selLen + ' layers:';

  if (_selLen < 2)
    {
      alert('Error\nLess than 2 objects selected');
      return;
    }

  var mainWindow = new Window('dialog', _NAME + ' ' + _VERSION, undefined); // main window
      mainWindow.orientation = 'column';
      mainWindow.alignChildren = 'fill';

  var groupNewName = mainWindow.add('group', undefined); // new name string group
      groupNewName.orientation = 'row';
  var newNameTitle = groupNewName.add('statictext', undefined);
      newNameTitle.text = _newNameTitle;
  var newNameInput = groupNewName.add('edittext');
      newNameInput.characters = 16;
      newNameInput.active = true;

  var layersOnlyCheck = mainWindow.add('checkbox', undefined, 'Rename layers only'); // rename layers only checkbox
      layersOnlyCheck.helpTip = "When checked, the script will rename the first parent\n" +
                                "of an item if it's only a layer, not a group, etc.\n";
      layersOnlyCheck.value = true;
  var replaceCheck = mainWindow.add('checkbox', undefined, 'Find and replace all matches'); // find and replace checkbox
      replaceCheck.helpTip = 'Enter the part of the name you want to replace.\n' +
                             'E.g.: if you enter "MY", it will replace all\n' +
                             'the "MY" occurrences in selected names';
      replaceCheck.value = false;

  var groupReplace = mainWindow.add('group', undefined); // replacement string group
      groupReplace.orientation = 'row';
      mainWindow.alignChildren = 'fill';
      groupReplace.enabled = false;
  var replaceTitle = groupReplace.add('statictext', undefined, 'Search string:');
  var replaceInput = groupReplace.add('edittext');
      replaceInput.characters = 16;

  var autoNumberCheck = mainWindow.add('checkbox', undefined, 'Auto-numbering'); // auto-numbering checkbox
      autoNumberCheck.helpTip = 'Eg: name_1, name_2, etc.';
      autoNumberCheck.value = true;

  var groupAutoNumber = mainWindow.add('group'); // auto-numbering group
      groupAutoNumber.orientation = 'row';
  var startNumberTitle = groupAutoNumber.add('statictext', undefined, 'Start from'); // start number
  var startNumberInput = groupAutoNumber.add('edittext', undefined, 1);
      startNumberInput.preferredSize.width = 25;
  var separatorTitle = groupAutoNumber.add('statictext', undefined, 'Separator'); // separator
  var separatorInput = groupAutoNumber.add('edittext', undefined, '_');
      separatorInput.helpTip = 'E.g.: name_1, name_2, etc.';
      separatorInput.preferredSize.width = 25;

  replaceCheck.onClick = function () // toggle find & replace
    {
      if (replaceCheck.value)
        {
          groupReplace.enabled = true;
          newNameTitle.text = _replaceTitle;
          startNumberInput.enabled = false;
          separatorInput.enabled = false;
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
          startNumberInput.enabled = true;
          separatorInput.enabled = true;
          replaceCheck.value = false;
          groupReplace.enabled = false;
        }
      else
        {
          startNumberInput.enabled = false;
          separatorInput.enabled = false;
        }
    }

  startNumberInput.onChange = function () { this.text = convertToNum(startNumberInput.text); }
  shiftInputNumValue(startNumberInput);

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

  btnCancel.onClick = function() {mainWindow.close();}
  btnOK.onClick = function()
    {
      renameFirstParentLayer(); // add input check and for replace
      reopenPnl();
      mainWindow.close();
    }

  function renameFirstParentLayer()
    {
      var autoNumber = startNumberInput.text;
      switch (replaceCheck.value)
      {
        case false:
          for (var i = 0; i < _selLen; i++)
            {
              var iObj = _selection[i];
              var iParent = iObj.parent;
              if (layersOnlyCheck.value && (iParent.typename != 'Layer'))
                {
                  alert("Object " + iParent.name + " was not renamed,\n" +
                        "because it's not a layer");
                  continue;
                }
              iParent.name = newNameInput.text;
              if (autoNumberCheck.value)
                {
                  iParent.name += separatorInput.text + autoNumber;
                  autoNumber++;
                }
            }
          break;

        default:
          for (var i = 0; i < _selLen; i++)
            {
              var iObj = _selection[i];
              var iParent = iObj.parent;
              if (layersOnlyCheck.value && (iParent.typename != 'Layer'))
                {
                  alert("Object " + iParent.name + " was not renamed,\n" +
                        "because it's not a layer");
                  continue;
                }
              iParent.name = iParent.name.replaceAll(replaceInput.text, newNameInput.text);
            }
          break;
      }
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

String.prototype.replaceAll = function(search, replacement){return this.replace(new RegExp(search, 'g'), replacement);};

try {
  main();
} catch (e) {alert(e);}