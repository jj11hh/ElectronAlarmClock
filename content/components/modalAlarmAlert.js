module.exports = {
    name: "ModalAlarmAlert",
    data: function () {
        return {
        }
    },
    props: {
        dialog: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
            default: "时间到"
        },
        delayable: {
            type: Boolean,
            default: true,
        }
    },
    methods: {
        onConfirm () {
            this.$emit("confirm")
        },
        onDelay (){
            this.$emit("delay")
        }
    },
    template:`
    <v-layout row justify-center>
        <v-dialog
            v-model="dialog" 
            :close-on-content-click="false"
            lazy
            persistent
            max-width="290px"
            min-width="290px"
        >
        <v-card>
            <v-card-title class="headline">
                {{title}}
            </v-card-title>
            <v-card-text>
            <v-flex xs12>
                <slot></slot>
            </v-flex>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn flat @click="onConfirm">确定</v-btn>
                <template v-if="delayable">
                    <v-btn flat @click="onDelay">推迟5分钟</v-btn>
                </template>
            </v-card-actions>
        </v-card>
        </v-dialog>
    </v-layout>
`
}
