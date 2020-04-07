function allOf(iterable, lambda) {
    for (let iter of iterable){
        if (! lambda(iter)){
            return false
        }
    }
    return true
}

module.exports = {
    name: "ModalAlarmSet",
    data: function () {
        return {
            menuTime: false,
            cnWeekdays: "星期一 星期二 星期三 星期四 星期五 星期六 星期日" .split(" "),
            validate: false,
        }
    },
    props: {
        dialog: {
            type: Boolean,
            default: false,
        },
        alarm: {
            type: Object,
            default: () => ({
                time: "09:00",
                todo: "起床",
                disabled: false,
                cancelNext: false,
                activeDays: [1, 2, 3, 4, 5, 6, 7]
            })
        }
    },
    methods: {
        onOk() {
            let alarm = Object.assign({}, this.alarm)
            this.$emit("confirmed", alarm)
        },
        onCancel() {
            let alarm = Object.assign({}, this.alarm)
            this.$emit("canceled", alarm)
        },
        ruleRequired (value){
            if (typeof value !== "string"){
                value = ""
            }
            if (value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') == ""){
                return "不得为空"
            }
            else {
                return true
            }
        },
    },
    computed:{
        activeWeekday:{
            set(v){
                if (v){
                    let set = new Set([...this.alarm.activeDays, 1,2,3,4,5])
                    this.alarm.activeDays = Array.from(set)
                }
                else{
                    let set = new Set(this.alarm.activeDays)
                    for (i of [1,2,3,4,5]){
                        if (set.has(i)){
                            set.delete(i)
                        }
                    }
                    this.alarm.activeDays = Array.from(set)
                }
            },
            get(){
                let set = new Set(this.alarm.activeDays)
                if ([1,2,3,4,5].every((x) => (set.has(x)))){
                    return true
                }
                return false
            }
        },
        activeWeekend : {
            set(v){
                if (v){
                    let set = new Set([...this.alarm.activeDays, 6,7])
                    this.alarm.activeDays = Array.from(set)
                }
                else{
                    let set = new Set(this.alarm.activeDays)
                    for (i of [6,7]){
                        if (set.has(i)){
                            set.delete(i)
                        }
                    }
                    this.alarm.activeDays = Array.from(set)
                }
            },
            get(){
                let set = new Set(this.alarm.activeDays)
                if ([6,7].every((x) => (set.has(x)))){
                    return true
                }
                return false
            }
        }
    },
    template: `  
<v-layout row justify-center>
<v-dialog
    v-model="dialog" 
    persistent max-width="400px"
    fullscreen hide-overlay>
    <v-card>
    <v-card-title class="headline">闹钟设置</v-card-title>
    <v-card-text>
    <v-container grid-list-md>
        <v-form v-model="validate">
            <v-layout wrap>
                <v-flex xs4>
                    <v-dialog
                        ref="menu"
                        v-model="menuTime"
                        :close-on-content-click="false"
                        :nudge-right="40"
                        :return-value.sync="alarm.time"
                        lazy
                        transition="scale-transition"
                        offset-y
                    >
                        <template v-slot:activator="{ on }">
                        <v-text-field
                            v-model="alarm.time"
                            label="时间"
                            prepend-icon="access_time"
                            readonly
                            v-on="on"
                            :rules="[ruleRequired]"
                        ></v-text-field>
                        </template>
                        <v-time-picker
                            v-if="menuTime"
                            v-model="alarm.time"
                            full-width
                            format="24hr"
                            @click:minute="$refs.menu.save(alarm.time)"
                            color="primary"
                            :rules="[ruleRequired]"
                        ></v-time-picker>
                    </v-dialog>
                </v-flex>
                <v-flex xs8>
                    <v-text-field
                        v-model="alarm.todo"
                        label="事件"
                        prepend-icon="event"
                        xs6
                        :rules="[ruleRequired]"
                    ></v-text-field>
                </v-flex>
            </v-layout>
            <v-layout wrap>
                <v-flex xs6 sm3 md3>
                    <v-checkbox
                        label="禁用"
                        v-model="alarm.disabled"
                    ></v-checkbox>
                </v-flex>
                <v-flex xs6 sm3 md3>
                    <v-checkbox
                        label="取消下次"
                        v-model="alarm.cancelNext"
                    ></v-checkbox>
                </v-flex>
            </v-layout>
            <v-layout row wrap>
                <v-flex xs6 sm3 md3>
                    <v-checkbox
                        label="周末"
                        v-model="activeWeekend"
                    ></v-checkbox>
                </v-flex>
                <v-flex xs6 sm3 md3>
                    <v-checkbox
                        label="工作日"
                        v-model="activeWeekday"
                    ></v-checkbox>
                </v-flex>
            </v-layout>
            <v-layout row wrap>
                <template xs4 sm3 md1 v-for="(dayName, i) in cnWeekdays">
                    <v-checkbox :label="dayName" :value="i + 1" v-model="alarm.activeDays"></v-checkbox>
                </template>
            </v-layout>
        </v-form>
    </v-container>
    </v-card-text>
    <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
        color="primary"
        flat
        @click="onOk"
        :disabled="!validate"
        >
        确定
        </v-btn>
        <v-btn
        color="secondry"
        flat
        @click="onCancel"
        >
        取消
        </v-btn>
    </v-card-actions>
    </v-card>
</v-dialog>
</v-layout>
`
}
