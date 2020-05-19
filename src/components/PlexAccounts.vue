<template>
<div>
    <h4>Plex Accounts</h4>
    <button v-on:click="AddAccount()">Add Plex Account</button>
    <span>{{errors}}</span>
    <ul>
        <li v-for="(account, index) in accounts" :key="index">
            <b>ID:</b> {{account.id}}
            <b>Title:</b> {{account.title}}
            <b>Token:</b> {{account.token}}
            <button v-on:click="DeleteAccount(account.id)">Delete</button>
        </li>
    </ul>
</div>
</template>

<script>
import axios from "axios"
import xml2js from "xml2js"
import { plex } from "../api/plex"
export default {
    data () {
        return {
            accounts: [],
            errors: null,
            selected: ''
        }
    },
    created: async function () {
        try {
            this.accounts = await plex.getPlexAccounts()
        } catch (err) {
            this.errors = err
            setTimeout(() => {
                this.errors = null
            }, 10000)
        }
    },
    methods: {
        AddAccount: async function () {
            this.errors = null
            try {
                let account = await plex.SignIn()
                this.accounts = await plex.postPlexAccount(account.title, account.authToken)
            } catch (err) {
                this.errors = err
                setTimeout(() => {
                    this.errors = null
                }, 10000)
            }
        },
        DeleteAccount: async function (id) {
            try {
                this.accounts = await plex.deletePlexAccount(id)
            } catch (err) {
                this.errors = err
                setTimeout(() => {
                    this.errors = null
                }, 10000)
            }
        }
    }
}
</script>