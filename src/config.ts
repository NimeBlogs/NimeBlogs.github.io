import type {
	AnnouncementConfig,
	AuthorActivityConfig,
	CommentConfig,
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
 	CommentConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "NIME blog",
	subtitle: "Kerwen 的小破站",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 180, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: true, // Hide the theme color picker for visitors
	},
	banner: {
		enable: false,
		src: "assets/images/demo-banner.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 3, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.Series,
		LinkPreset.Friends,
		LinkPreset.Message,
		// LinkPreset.List,
		LinkPreset.Activity,
		LinkPreset.About,
		{
			name: "洛谷",
			url: "https://www.luogu.com.cn/user/762100", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/demo-avatar.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "Kerwen",
	bio: "一个爱捣鼓电脑的OIer，请多多指教呀喵~！",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/saicaca/fuwari",
		},
		{
			name: "BiliBili",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/3493076901300236",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};

export const commentConfig: CommentConfig = {
  disqus: {
    shortname: 'fuwari',
  },
  // giscus: {
  //   repo: 'moeyua/fuwari',
  //   repoId: 'R_kgDOKy9HOQ',
  //   category: 'General',
  //   categoryId: 'DIC_kwDOKy9HOc4CegmW',
  //   mapping: 'title',
  //   strict: '0',
  //   reactionsEnabled: '1',
  //   emitMetadata: '1',
  //   inputPosition: 'top',
  //   theme: 'light',
  //   lang: 'zh-CN',
  //   loading: 'lazy',
  // },
  twikoo: {
    envId: 'https://kerwentwikoo.netlify.app/.netlify/functions/twikoo',
  },
}

export const announcementConfig: AnnouncementConfig = {
	enable: true,
	announcements: [
		{
			content: "🎉 欢迎访问我的博客！这里有最新的技术分享和个人思考。",
			type: 'info',
			title: "欢迎公告",
			dismissible: false,
		},
		{
			content: "📢 网站最近进行了更新，新增了一些功能，请体验！",
			type: 'success',
			title: "更新通知",
			dismissible: true,
		},
		{
			content: "⚠️ 请注意，本网站内容仅供学习参考，请勿用于商业用途。",
			type: 'warning',
			title: "重要提示",
			dismissible: false,
		}
	],
};

export const authorActivityConfig: AuthorActivityConfig = {
	enable: true,
	showLimit: 10,
	activities: [
		{
			id: "1",
			title: "新文章发布",
			description: "React 18新特性详解与实战案例",
			type: 'post',
			date: new Date("2023-11-10"),
			link: "/posts/react-18-features/",
			icon: "fa6-solid:file-lines",
			image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
		},
		{
			id: "6",
			title: "周末旅行",
			description: "探索了城市周边的自然风光，拍摄了许多美丽的照片",
			date: new Date("2023-11-08"),
			icon: "fa6-solid:mountain",
			image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
		},
		{
			id: "2",
			title: "博客主题更新",
			description: "全新界面设计，提升用户体验",
			type: 'update',
			date: new Date("2023-11-05"),
			icon: "fa6-solid:arrows-rotate"
		},
		{
			id: "7",
			title: "新项目启动",
			description: "开始开发一个新的开源项目，敬请期待",
			type: 'milestone',
			date: new Date("2023-10-30"),
			icon: "fa6-solid:rocket",
			image: "https://images.unsplash.com/photo-1633158349003-7f852de64d54?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
		},
		{
			id: "3",
			title: "参加技术会议",
			description: "2023前端技术峰会",
			type: 'event',
			date: new Date("2023-10-28"),
			icon: "fa6-solid:calendar",
			image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
		},
		{
			id: "4",
			title: "里程碑达成",
			description: "博客访问量突破10000",
			type: 'milestone',
			date: new Date("2023-10-15"),
			icon: "fa6-solid:trophy"
		},
		{
			id: "5",
			title: "开源项目更新",
			description: "发布了v2.0版本",
			type: 'update',
			date: new Date("2023-10-01"),
			link: "https://github.com/username/project",
			external: true,
			icon: "fa6-brands:github"
		}
	]
};
