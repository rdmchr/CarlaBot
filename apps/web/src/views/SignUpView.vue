<template>
  <form>
    <input type="email" v-model="email" placeholder="Email"/>
    <input type="password" v-model="password" placeholder="Password"/>
    <button @click="signUp">Sign Up</button>
  </form>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref } from 'vue';

const route = useRoute();

const {code} = route.query;
console.log(code);

const res = await fetch(`http://localhost:4000/auth?code=${code}`);
console.log(await res.text());

const email = ref('');
const password = ref('');

function signUp() {
  console.log(email, '       ', password);
}
</script>

<style scoped>

</style>