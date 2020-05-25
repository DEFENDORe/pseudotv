<template>
<div>
        <h2>Plex Library</h2>
        <select v-if="selectedAccount" v-model="selectedAccount" @change="SelectAccount()">
            <option v-for="(account, index) in accounts" :key="index" v-bind:value="account">
                {{ account.title }}
            </option>
        </select>
        <select v-if="selectedAccount" v-model="selectedServer" @change="SelectServer()">
            <option v-for="(server, index) in selectedAccount.servers" :key="index" v-bind:value="server">
                {{ server.name }}
            </option>
        </select>
        <select v-if="selectedServer" v-model="selectedConnection" @change="SelectConnection()">
            <option v-for="(connection, index) in selectedServer.connections" :key="index" v-bind:value="connection">
                {{ connection.uri }}
            </option>
        </select>

        <ul v-if="sections">
            <li v-for="section in sections" :key="section">
                {{section.title}} - {{section}}
                <ul v-if="section.nested">
                    <li v-for="nested in section.nested" :key="nested">
                        {{nested.title}}
                    </li>
                </ul>
            </li>
        </ul>
</div>
</template>

<script>
import { plex } from "../api/plex"
export default {
    created: async function () {
        this.accounts = await plex.getPlexAccounts()
        if (this.accounts.length > 0) {
            this.selectedAccount = this.accounts[0]
            this.SelectAccount()
        }
    },
    data () {
        return {
            accounts: [],
            selectedAccount: null,
            selectedServer: null,
            selectedConnection: null,
            sections: null
        }
    },
    methods: {
        async SelectAccount () {
            if (this.selectedAccount.servers.length > 0) {
                this.selectedServer = this.selectedAccount.servers[0]
                return this.SelectServer()
            }
        },
        async SelectServer () {
            if (this.selectedServer.connections.length > 0) {
                this.selectedConnection = this.selectedServer.connections[0]
                return this.SelectConnection()
            }
        },
        async SelectConnection() {
            this.sections = await plex.getSections(this.selectedAccount, this.selectedConnection)
            console.log(this.sections)
        }
    }
}
</script>
