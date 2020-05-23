<template>
  <div>
    <AppHeader></AppHeader>
    <router-link to="/channels">Channels</router-link> - 
    <router-link to="/settings">Settings</router-link>
    <router-view></router-view>
  </div>
</template>

<script>
import AppHeader from "./components/AppHeader.vue";
export default {
  components: {
    AppHeader
  }
};
</script>