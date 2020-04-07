// Modules to control application life and create native browser window

const path = require('path')
const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron')
const Store = require("electron-store")
const Moment = require('moment')

const schema = {
  firstRun: {
    type: "boolean",
    default: true
  },
  alarm: {
    type: "object",
    default: {
    }
  },
  alarmMusic: {
    type: "string",
    default: "Upbeat"
  }
}

const store = new Store({schema})

const icon_path = path.join(__dirname, "time-icon.png")

let alarm_list = store.get('alarm')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let appTray = null

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    show: false,
    icon: icon_path
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  //mainWindow.webContents.openDevTools({mode:'detach'})
  mainWindow.once("ready-to-show", function(){
    mainWindow.show()
  })
  mainWindow.on('close', function (event) {
    if(!app.isQuiting){
        event.preventDefault();
        mainWindow.hide();
    }
  
    return false;
  });
}

function createTray() {
  let trayMenu = [
    {
      label: "显示主界面",
      click: () => {
        if (mainWindow) { mainWindow.show() }
        //else { createWindow() }
      }
    },
    {
      label: "退出",
      click: () => {
        app.isQuiting = true;
        app.quit();
      } 
    }
  ];
  appTray = new Tray(icon_path)
  let ctxMenu = Menu.buildFromTemplate(trayMenu)
  appTray.setToolTip('CLock')
  appTray.setContextMenu(ctxMenu)
}

function initProcess() {
  createWindow()
  createTray()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.on('ready', initProcess)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function renderAlarm(){
  let alarm_send = {}
  for (i in alarm_list){
    alarm_send[i] = Object.assign({}, alarm_list[i])
    alarm_send[i].cancelNext = (alarm_list[i].dayLastAlarm >= Moment().dayOfYear())
  }
  mainWindow.webContents.send("render-alarms", alarm_send)
}

ipcMain.on('request-update', () => {
  renderAlarm()
})

ipcMain.on('request-exit', () => {
  app.isQuiting = true;
  app.quit();
})

ipcMain.on('show-window', () => {
  mainWindow.show()
})

ipcMain.on('request-music', () => {
  console.log(`request-music`)
  mainWindow.webContents.send("render-music", store.get("alarmMusic"))
})

ipcMain.on('del-alarm', function(event, arg){
  console.log(`del-alarm ${arg}`)
  delete alarm_list[arg]
  renderAlarm()
})

ipcMain.on('add-alarm', function (event, arg){
  console.log(`add-alarm ${JSON.stringify(arg)}`)
  let id = Math.round(Math.random() * (1 << 30));
  while(id in alarm_list){
    id = Math.round(Math.random() * (1 << 30));
  }

  let alarm = {}
  alarm.time = arg.time
  alarm.todo = arg.todo
  if (arg.cancelNext){
    let alarmTime = Moment(alarm.time, "HH:mm")
    let diff = Moment() - alarmTime
    if (diff > 0){
      alarm.dayLastAlarm = Moment().dayOfYear() + 1
    }
    else{
      alarm.dayLastAlarm = Moment().dayOfYear()
    }
  }
  else{
    alarm.dayLastAlarm = Moment().dayOfYear() - 1
  }
  alarm.activeDays = arg.activeDays || []
  alarm.disabled = arg.disabled

  alarm_list[id] = alarm
  console.log(arg)
  console.log(`id = ${id}`)
  renderAlarm()
})

ipcMain.on("change-music", function(event, arg){
  console.log(`change-music ${arg}`)
  store.set("alarmMusic", arg)
})

let dayChecked = Moment().dayOfYear()

function checkAlarm(){
  for (let id in alarm_list){
    let alarm = alarm_list[id]
    let today = Moment().dayOfYear()
    console.log(alarm)
    console.log(alarm.dayLastAlarm != today )
    console.log(!alarm.disabled)
    console.log(alarm.activeDays.includes(Moment().isoWeekday()))
    if (alarm.dayLastAlarm != today && !alarm.disabled && alarm.activeDays.includes(Moment().isoWeekday())){
      let alarmTime = Moment(alarm.time, "HH:mm")
      let diff = Moment() - alarmTime
      if (diff > 0 && diff < 5000){
        mainWindow.webContents.send("show-alarm", alarm)
        mainWindow.show()
        alarm.dayLastAlarm = today
      }
    }
  }
  if (Moment().dayOfYear !== dayChecked){
    renderAlarm()
    dayChecked = Moment().dayOfYear()
  }
}

function storeAlarm(){
  store.set("alarm", alarm_list)
}

setInterval(checkAlarm, 1000)
setInterval(storeAlarm, 5000)
