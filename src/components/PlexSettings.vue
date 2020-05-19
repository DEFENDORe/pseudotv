<template>
  <div>
      <h3>PlexSettings</h3>
      <PlexAccounts></PlexAccounts>
      <PlexLibrary></PlexLibrary>
  </div>
</template>

<script>
import PlexAccounts from "./PlexAccounts"
import PlexLibrary from "./PlexLibrary"
export default {
    components: {
        PlexAccounts,
        PlexLibrary
    }
}
</script>
