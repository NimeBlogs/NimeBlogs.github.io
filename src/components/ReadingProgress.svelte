<script>
import { onDestroy, onMount } from "svelte";

// 监听滚动事件，更新阅读进度
let progress = 0;

const updateProgress = () => {
	// 获取文档总高度和可视区域高度
	const totalHeight =
		document.documentElement.scrollHeight - window.innerHeight;
	// 获取当前滚动位置
	const progressHeight = window.scrollY;
	// 计算进度百分比
	progress = (progressHeight / totalHeight) * 100;
};

// 组件挂载时添加事件监听
onMount(() => {
	window.addEventListener("scroll", updateProgress);
	// 初始更新一次进度
	updateProgress();
	// 组件销毁时移除事件监听
	return () => window.removeEventListener("scroll", updateProgress);
});
</script>

<!-- 进度条元素 -->
<div 
  class="fixed top-0 left-0 h-1 bg-[var(--primary)] z-50 transition-all duration-200 ease-out"
  style="width: {progress}%"
  aria-label="阅读进度"
/>