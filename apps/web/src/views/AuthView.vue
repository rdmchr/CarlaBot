<template>
  <p>{{ error }}</p>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref } from 'vue';

const route = useRoute();
const error = ref('');

const DISCORD_OAUTH_CLIENT_ID = "974441801798795285";
const WEB_URL = "http://localhost";
const SERVER_URL = "http://localhost:3001";

if (!route.query.code) {
  window.location.href = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(DISCORD_OAUTH_CLIENT_ID)}&redirect_uri=${encodeURIComponent(WEB_URL)}/auth&response_type=code&scope=identify%20connections%20email%20guilds`;
} else {
  const code = route.query.code;
  const res = await fetch(`${SERVER_URL}/auth?code=${code}`, {
    credentials: 'include',
  });
  const json = await res.json();
  console.log(json);
  if (json.error) {
    error.value = json.error;
  }
}


</script>

<style scoped>

</style>