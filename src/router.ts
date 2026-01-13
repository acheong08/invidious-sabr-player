import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./pages/HomePage.vue";
import WatchPage from "./pages/WatchPage.vue";

export const router = createRouter({
	history: createWebHistory("/"),
	routes: [
		{
			path: "/",
			redirect: "/sabr/",
		},
		{
			path: "/sabr/",
			component: HomePage,
		},
		{
			// Support /watch?v=:id (query param extracted in WatchPage)
			path: "/watch",
			component: WatchPage,
		},
		{
			path: "/watch/:id",
			component: WatchPage,
		},
		{
			path: "/sabr/watch/:id",
			component: WatchPage,
		},
	],
});
