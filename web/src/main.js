import Vue from 'vue'
import VueRouter from 'vue-router'
import Channels from './components/Channels'
import Settings from './components/Settings'
import PlexSettings from './components/PlexSettings'
import App from './App'

Vue.use(VueRouter)

const routes = [
  { path: '*', redirect: '/channels' },
  { 
      path: '/settings',
      component: Settings,
      children: [
        { path: 'plex', component: PlexSettings }
      ]
  },
  { path: '/channels', component: Channels }
]
const router = new VueRouter({
  routes: routes
})

new Vue({
  el: '#app',
  router: router,
  render: h => h(App)
})
