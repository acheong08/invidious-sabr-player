<style>
body {
  background-color: #202020;
}

.app {
  display: flex;
  font-family: Arial, sans-serif;
  text-align: center;
  flex-direction: column;
  align-items: center;
}
</style>

<template>
  <div class="app">
    <router-view/>
  </div>
</template>

<script lang="ts" setup>
import { Innertube, UniversalCache } from 'youtubei.js/web';
import { fetchFunction } from './utils/helpers';
import { botguardService } from './services/botguard';
import { provide, shallowRef } from 'vue';

let innertubePromise: Promise<Innertube | undefined> | undefined;
const innertubeInstance = shallowRef<Innertube | undefined>(undefined);

async function initInnertube() {
  try {
    const instance = await Innertube.create({
      cache: new UniversalCache(true),
      fetch: fetchFunction
    });

    botguardService.init().then((bgClient) => {
      console.info('[App]', 'BotGuard client initialized');
      Object.assign(window, { botguardService, bgClient });
    });

    innertubeInstance.value = instance;
    return instance;
  } catch (error) {
    console.error('[App]', 'Failed to initialize Innertube', error);
    innertubePromise = undefined;
    return undefined;
  }
}

async function getInnertube() {
  if (innertubeInstance.value) return innertubeInstance.value;
  if (!innertubePromise) innertubePromise = initInnertube();
  return innertubePromise;
}

provide('innertube', getInnertube);

innertubePromise = initInnertube();
</script>