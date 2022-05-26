<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/auth">Login</RouterLink>
    </nav>
  </header>

  <Suspense>

    <RouterView/>

    <template #fallback>
      Loading...
    </template>

  </Suspense>
</template>

<style>
</style>
