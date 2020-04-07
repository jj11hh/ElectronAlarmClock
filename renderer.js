// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const colors = require('./node_modules/vuetify/es5/util/colors')

Vue.use(Vuetify,{
    theme: {
        primary: '#4285F4',
        secondary: '#424242',
        accent: '#82B1FF',
        error: '#ff4444',
        info: '#33b5e5',
        success: '#00C851',
        warning: '#ffbb33'
    }
})

const {ipcRenderer} = require("electron")
const $ = require('./node_modules/jquery/dist/jquery.min.js')
const moment = require('./node_modules/moment/min/moment.min.js')
const {Howl, Howler} = require('./node_modules/howler/dist/howler')
const ModalAlarmSet = require('./content/components/modalAlarmSet')
const ModalAlarmAlert = require('./content/components/modalAlarmAlert')

const CNWeekdays = "星期一 星期二 星期三 星期四 星期五 星期六 星期日" .split(" ")

function todayCNWeekday(){
    return CNWeekdays[moment().isoWeekday() - 1]
}

function dayToCN(day){
    return CNWeekdays[day - 1]
}

function loadMusic(m){
    console.log("loading "+["./assets/", m, ".mp3"].join(""))
    return new Howl({
        src : [["./assets/", m, ".mp3"].join("")],
        loop : true
    })
}

appRoot = new Vue({
    el: '#app',
    data: function(){
        return {
            cnWeekdays: CNWeekdays,
            alarmMusicFiles: ["Infinite", "Upbeat", "Wild Strawberry"],
            alarmMusic: null,
            alarmHowl: null,
            alarmToEdit: {
            },
            dialogAdd: false,
            dialogEdit: false,
            dialogAlarm: false,
            dialogAlarmData: {time: "--:--", todo: "----"},
            editId: null,
            alarms: [],
            records: [],
            stopwatchBegin: null,
            stopwatchStarted: false,
            stopwatchTime: "00:00:00",
            stopwatchInterval: null,
            timerSet: null,
            timerTime: "00:00:00",
            timerInterval: null,
            timerStarted: false,
            timerSelections: {
                '15秒': '00:00:15',
                '30秒': '00:00:30',
                '1分钟': '00:01:00',
                '1分半': '00:01:30',
                '2分钟': '00:02:00',
                '5分钟': '00:05:00',
                '10分钟': '00:10:00',
                '15分钟': '00:15:00',
                '30分钟': '00:30:00',
                '45分钟': '00:45:00',
                '1小时' : '01:00:00',
            },
            timerSelected: null,
            timerSettedString: {},
            timerSetH: "0",
            timerSetM: "0",
            timerSetS: "0",
            timerValidate: false,
            curTime: "00:00",
            curDate: "1999.09.05",
            curWeekday: "",
            drawer: false,
            clipped: false,
        }
    },
    computed: {
        timerSetted: {
            set (v){
            },
            get (){
                if (this.timerSelected != "自定义"){
                    return this.timerSelections[this.timerSelected]
                }
                else {
                    return [this.timerSetH, this.timerSetM, this.timerSetS].join(':')
                }
            }
        }
    },
    methods: {
        dayToCN,
        addAlarm: function() {
            this.dialogAdd = true
        },
        delAlarm: function(alarm) {
            let itemId = alarm.itemId
            ipcRenderer.send('del-alarm', itemId)
            delete this.alarms[itemId]
            console.log("del-alarm "+itemId)
        },
        editAlarm: function(alarm) {
            //this.$refs.modalSet.alarm = alarm
            this.alarmToEdit = alarm
            this.editId = alarm.itemId
            this.dialogEdit = true
        },
        onAddOk: function(data){
            this.dialogAdd = false
            console.log(data)
            ipcRenderer.send('add-alarm', {
                time: data.time,
                todo: data.todo,
                cancelNext: data.cancelNext,
                disabled: data.disabled,
                activeDays: data.activeDays
            })
        },
        onAddCancel: function(){
            this.dialogAdd = false
        },
        onEditOk: function(data){
            this.dialogEdit = false
            console.log(data)
            ipcRenderer.send('del-alarm', this.editId)
            ipcRenderer.send('add-alarm', {
                time: data.time,
                todo: data.todo,
                cancelNext: data.cancelNext,
                disabled: data.disabled,
                activeDays: data.activeDays
            })
        },
        onEditCancel: function(){
            this.dialogEdit = false
        },
        stopwatchStart: function(){
            this.stopwatchBegin = moment()
            this.records = []
            this.stopwatchStarted = true
            let i = 1
            let repeat = () => {
                if (this.stopwatchStarted && this.stopwatchBegin !== null){
                    this.stopwatchTime = moment(moment() - this.stopwatchBegin).format("mm:ss:SS")
                    window.requestAnimationFrame(repeat)
                }
            }
            window.requestAnimationFrame(repeat)
        },
        stopwatchStop: function(){
            this.stopwatchRecord()
            this.stopwatchStarted = false
        },
        stopwatchRecord: function(){
            this.records.push({
                index : this.records.length + 1,
                time : this.stopwatchTime
            })
        },
        timerStart: function(){
            let time = {
                hour: parseInt(this.timerTime.split(':')[0]),
                minute: parseInt(this.timerTime.split(':')[1]),
                second: parseInt(this.timerTime.split(':')[2])
            }
            this.timerSet = moment().utc()
            this.timerSet.add(time.hour, "hours")
            this.timerSet.add(time.minute, "minutes")
            this.timerSet.add(time.second, "seconds")
            this.timerInterval = setInterval(()=>{
                if (moment().utc().isAfter(this.timerSet)){
                    this.alert({
                        time: "00:00",
                        todo: "定时器时间到"
                    })
                    this.timerClear()
                }
                else {
                    let dt = moment(this.timerSet - moment().utc()).utc()
                    this.timerTime = dt.format("HH:mm:ss")
                }
            }, 500)
            this.timerStarted = true
        },
        timerStop: function(){
            clearInterval(this.timerInterval)
            this.timerSet = null
            this.timerStarted = false
        },
        timerClear: function(){
            this.timerStop()
            this.checkTimer()
        },
        stopwatchClear: function(){
            this.stopwatchBegin = null
            this.stopwatchTime = "00:00:00"
            this.records = []
            this.stopwatchStarted = false
        },
        onAlarmConfirm: function(){
            this.dialogAlarm = false
            this.alarmHowl.stop()
        },
        onAlarmDelay: function(){
            this.dialogAlarm = false
            this.alarmHowl.stop()
        },
        testAlarm: function(){
            this.alert({
                time: moment().format("HH:mm"),
                todo: "测试闹钟"
            })
        },
        alert: function(data){
            ipcRenderer.send("show-window")
            this.dialogAlarm = true
            this.dialogAlarmData = data
            if (this.alarmHowl === null){
                this.alarmHowl = loadMusic(this.alarmMusic)
            }
            this.alarmHowl.seek(3)
            this.alarmHowl.play()
        },
        changeMusic: function(){
            console.log(`change-music ${this.alarmMusic}`)
            ipcRenderer.send("change-music", this.alarmMusic)
            if (this.alarmHowl !== null){
                this.alarmHowl.stop()
            }
            this.alarmHowl = loadMusic(this.alarmMusic)
        },
        selectTimer(){
            if (this.timerSelected){
                let time = this.timerSelections[this.timerSelected]
                let [h, m, s] = time.split(":")
                this.timerSetH = `${h}`
                this.timerSetM = `${m}`
                this.timerSetS = `${s}`
                if (!this.timerStarted){
                    this.timerTime = `${h}:${m}:${s}`;
                }
            }
        },
        checkTimer (){
            let h,m,s
            h = parseInt(this.timerSetH.replace(/[^0-9]/g, "") || "0")
            m = parseInt(this.timerSetM.replace(/[^0-9]/g, "") || "0")
            s = parseInt(this.timerSetS.replace(/[^0-9]/g, "") || "0")
            
            h = h > 99 ? 99 : h;
            m = m > 59 ? 59 : m;
            s = s > 59 ? 59 : s;
            this.timerSetH = `${h}`
            this.timerSetM = `${m}`
            this.timerSetS = `${s}`

            if (!this.timerStarted){
                let sh = h > 9 ? `${h}` : `0${h}`;
                let sm = m > 9 ? `${m}` : `0${m}`;
                let ss = s > 9 ? `${s}` : `0${s}`;
                this.timerTime = `${sh}:${sm}:${ss}`;
            }
            this.timerSelected = "自定义"
        },
        exit(){
            ipcRenderer.send("request-exit")
        }
    },
    components: {
        ModalAlarmSet,
        ModalAlarmAlert
    },
    mounted: function () {
        setInterval(() => {
            this.curTime = (moment().format("HH:mm:ss"))
            this.curDate = (moment().format("YYYY.M.D"))
            this.curWeekday = todayCNWeekday()
        }, 1000)
        ipcRenderer.send('request-update')
        ipcRenderer.send('request-music')

        ipcRenderer.on('render-alarms', (event, arg) => {
            let alarms = arg
            newAlarms = []
            for (let id in alarms){
                console.log(alarms[id])
                let newAlarm = Object.assign({}, alarms[id])
                newAlarm['itemId'] = id  
                newAlarms.push(newAlarm) 
            }
            this.alarms = newAlarms;
        })

        ipcRenderer.on('render-music', (event, arg) => {
            console.log(`render-music ${arg}`)
            if (this.alarmMusicFiles.includes(arg)){
                console.log(`${arg} found`)
                this.alarmMusic = arg
            }
        })
    
        ipcRenderer.on('show-alarm', (event, arg) => {
            this.alert(arg)
        })
    }
})
