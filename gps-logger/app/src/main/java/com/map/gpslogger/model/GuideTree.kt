package com.map.gpslogger.model

/**
 * 使用引导文档树。
 * 每个节点可以有子节点（分类）或内容（叶子）。
 */
data class GuideNode(
    val id: String,
    val title: String,
    val icon: String,
    val children: List<GuideNode> = emptyList(),
    val sections: List<GuideSection> = emptyList(),  // 叶子节点的内容
)

data class GuideSection(
    val heading: String,
    val body: String,
)

object GuideTree {

    val root = GuideNode("root", "使用指南", "📖", children = listOf(
        GuideNode("notebook", "笔记本系统", "📓", children = listOf(
            GuideNode("notebook-concept", "设计理念", "💭", sections = listOf(
                GuideSection("为什么需要笔记本？",
                    "日记不只是流水账，它承载着不同阶段、不同主题的生活。\n\n" +
                    "你可能同时在准备一场旅行、坚持跑步计划、记录读书心得。如果把所有内容混在一个列表里，时间久了就很难找到想要的内容。"),
                GuideSection("核心设计：信息流 + 标签",
                    "不同于「每个笔记本是独立容器」的传统做法，Nexus Pocket 采用「一个信息流 + 笔记本作为标签筛选」的设计。\n\n" +
                    "所有日记都在同一个时间线里，每篇日记带着笔记本标签（如 🧳云南之旅、🏃百日跑步）。你可以随时筛选某个笔记本，也可以查看全部。\n\n" +
                    "这样你不用来回切换笔记本，降低了使用负担。"),
                GuideSection("灵活性",
                    "笔记本可以随时创建、归档。阶段性的计划结束后归档即可，日记不会丢失，仍然可以在全部视图中看到。"),
            )),
            GuideNode("notebook-create", "创建与管理", "➕", sections = listOf(
                GuideSection("创建笔记本",
                    "1. 在日记页顶部点 ⚙️ 进入笔记本管理\n" +
                    "2. 点右下角 + 新建笔记本\n" +
                    "3. 填写名称、选择图标和类型\n\n" +
                    "类型包括：旅行、运动、成长、工作、日常、自定义。类型会影响日记编辑器默认展开的字段。"),
                GuideSection("管理笔记本",
                    "• 归档：阶段结束后可归档，日记仍保留在全部视图中\n" +
                    "• 恢复：归档的笔记本随时可以恢复\n" +
                    "• 默认笔记本「📖 日记」不可删除，新日记默认归属它"),
            )),
            GuideNode("notebook-tips", "使用技巧", "💡", sections = listOf(
                GuideSection("推荐的笔记本分类",
                    "• 🧳 旅行 — 每次旅行建一个，如「云南之旅」「日本自由行」\n" +
                    "• 🏃 运动 — 持续性计划，如「百日跑步」「健身记录」\n" +
                    "• 📖 成长 — 读书笔记、学习心得、自我反思\n" +
                    "• 💼 工作 — 项目日志、会议纪要、工作总结\n" +
                    "• 🍳 生活 — 菜谱、探店、日常记录\n\n" +
                    "当然，你也可以完全自由地创建任何主题。"),
                GuideSection("和现实的、虚拟的结合",
                    "旅行、工作等「现实」笔记本建议开启定位和照片，自动关联地理位置。\n" +
                    "读书、反思等「虚拟」笔记本则更侧重文字内容，定位不是必需的。"),
            )),
        )),

        GuideNode("diary", "写日记", "✏️", children = listOf(
            GuideNode("diary-types", "三种类型", "📝", sections = listOf(
                GuideSection("记忆 / 轨迹 / 笔记",
                    "每篇日记可以选择一种类型：\n\n" +
                    "🔵 记忆 — 纯记录，日常随想\n" +
                    "🟢 轨迹 — 关联 GPS 轨迹，适合户外活动\n" +
                    "📝 笔记 — 短小精悍的随手记录\n\n" +
                    "类型只是标记，不影响功能。你可以在任何类型中写任何内容。"),
            )),
            GuideNode("diary-autosave", "自动保存", "💾", sections = listOf(
                GuideSection("800ms 智能防抖",
                    "编辑日记时，每次修改会在 800 毫秒后自动保存。不需要手动点保存，专注于写作就好。\n\n" +
                    "点击右上角 ✓ 可以手动保存并返回。"),
            )),
            GuideNode("diary-notebook", "笔记本归属", "📓", sections = listOf(
                GuideSection("选择笔记本",
                    "新建日记时，顶部会显示所有笔记本的标签。点选一个即可归属到该笔记本。\n\n" +
                    "如果不选，默认归属「📖 日记」笔记本。\n\n" +
                    "在日记页顶部横滑可以按笔记本筛选查看。"),
            )),
        )),

        GuideNode("footprint", "足迹点亮", "📍", children = listOf(
            GuideNode("footprint-levels", "五级行政区划", "🗺️", sections = listOf(
                GuideSection("从国家到街道",
                    "足迹系统采用五级行政区划：\n\n" +
                    "🌍 国家 → 🏛️ 省份（34个）→ 🏙️ 城市（333个）→ 🏘️ 区县（2844个）→ 🛣️ 乡镇街道（38722个）\n\n" +
                    "点亮子区域时，所有祖先区域会自动点亮。比如点亮了「杭州市」，浙江省和中国的足迹也会自动创建。"),
            )),
            GuideNode("footprint-progress", "省份进度", "📊", sections = listOf(
                GuideSection("查看点亮进度",
                    "在足迹页面可以看到：\n\n" +
                    "• 总览卡片：已点亮省份/城市/区县数量\n" +
                    "• 全国总进度条\n" +
                    "• 省份列表：已点亮的显示 🟢，未点亮的显示 ⚫\n" +
                    "• 每个省份显示已点亮的城市数"),
            )),
            GuideNode("footprint-explorer-level", "探索等级", "🎯", sections = listOf(
                GuideSection("7 级探索等级",
                    "根据足迹点亮覆盖率自动升级：\n\n" +
                    "🌱 新手探索者（0%）→ 🗺️ 初级旅行者（5%）→ 🧳 资深旅行家（15%）\n" +
                    "→ ✈️ 环球探险家（30%）→ 🌍 世界征服者（50%）→ 👑 传奇旅行家（75%）\n" +
                    "→ 💎 全知全能（95%）\n\n" +
                    "覆盖率按省份/城市/区县加权平均计算。足迹页顶部和首页仪表盘可见等级卡片。"),
            )),
            GuideNode("footprint-celebration", "点亮庆祝", "🎉", sections = listOf(
                GuideSection("庆祝动画",
                    "点亮新足迹时会触发庆祝效果：\n\n" +
                    "• 点亮省份：彩色粒子撒花动画\n" +
                    "• 里程碑（1/5/10/20/34 省）：大庆祝 + 提示信息\n" +
                    "• 普通点亮：区域脉冲高亮\n\n" +
                    "每个里程碑都是你旅途中的重要时刻！"),
            )),
            GuideNode("footprint-wishlist", "愿望清单", "❤️", sections = listOf(
                GuideSection("记录想去的地方",
                    "足迹页新增「愿望」标签，记录你未来想去的目的地：\n\n" +
                    "🔴 想去了 — 最想去，优先级最高\n" +
                    "🟡 下次去 — 已有计划\n" +
                    "🟢 有机会去 — 随缘\n\n" +
                    "当你点亮了愿望清单中的地方，它会自动标记为「已去过」✅\n\n" +
                    "在「我的」页面也可以进入愿望清单管理。"),
            )),
        )),

        GuideNode("trip", "旅行记录", "✈️", sections = listOf(
            GuideSection("记录一次旅行",
                "1. 在日记页点 ✈️ 进入旅行列表\n" +
                "2. 点 + 新建旅行，填写标题和日期\n" +
                "3. 在写日记时可以将日记关联到旅行\n\n" +
                "旅行详情页会展示该旅行关联的所有日记，按日期排列。"),
            GuideSection("和笔记本的关系",
                "旅行是日记的组织维度之一。你可以为一次旅行创建一个专门的笔记本（如 🧳云南之旅），也可以使用旅行功能来分组管理。\n\n" +
                "两者可以配合使用：笔记本负责筛选，旅行负责时间线分组。"),
        )),

        GuideNode("photo", "照片管理", "📸", sections = listOf(
            GuideSection("照片功能",
                "照片系统会记录每张照片的：\n\n" +
                "• 拍摄时间（从 EXIF 读取）\n" +
                "• GPS 坐标（从 EXIF 读取）\n" +
                "• 所属行政区划\n" +
                "• 描述和标签\n\n" +
                "照片以网格形式展示，点击可查看大图。"),
            GuideSection("EXIF 导入",
                "支持从相册导入照片，自动解析 EXIF 信息中的 GPS 坐标和拍摄时间，按日期分组生成日记骨架。"),
        )),

        GuideNode("track", "GPS 轨迹", "🛤️", sections = listOf(
            GuideSection("轨迹记录",
                "GPS 轨迹是 Nexus Pocket 的核心功能：\n\n" +
                "1. 首页或首页 GPS 卡片开启记录\n" +
                "2. APP 会在后台持续采集 GPS 坐标\n" +
                "3. 停止后轨迹自动保存\n" +
                "4. WiFi 环境下自动上传到服务器\n\n" +
                "轨迹详情页显示：距离、时长、GPS 点数、起止时间。"),
            GuideSection("轨迹日记",
                "选择「🟢 轨迹」类型的日记可以关联 GPS 轨迹，形成「轨迹 + 文字 + 照片」的完整记录。"),
        )),

        GuideNode("stats", "数据统计", "📊", sections = listOf(
            GuideSection("统计面板",
                "在日记页点 📊 进入统计面板：\n\n" +
                "• 总日记数、已发布数、草稿数、带照片数\n" +
                "• 总字数、当前连续天数\n" +
                "• 最长连续记录\n\n" +
                "还有详细的：\n" +
                "• 月度趋势图（最近 12 个月）\n" +
                "• 心情分布图\n" +
                "• 类型分布图\n" +
                "• 城市点亮进度条（省份/城市覆盖率）\n" +
                "• 旅行距离统计（Haversine 公式计算）"),
        )),

        GuideNode("achievement", "成就系统", "🏆", children = listOf(
            GuideNode("achievement-overview", "成就勋章", "🏅", sections = listOf(
                GuideSection("22 枚成就勋章，分 5 大类",
                    "📝 日记 — 第一篇、10/50/100 篇、连续 3/7/30 天、图文并茂\n" +
                    "👣 足迹 — 第一步、5/10/20/34 个省\n" +
                    "🧳 旅行 — 第一次、5 次、10 次旅行\n" +
                    "📸 照片 — 10/50/100 张照片\n" +
                    "🛤️ 轨迹 — 第一篇轨迹日记、10 篇轨迹日记\n\n" +
                    "达到条件自动解锁，未解锁的显示 🔒。"),
            )),
            GuideNode("achievement-rarity", "成就稀有度", "💎", sections = listOf(
                GuideSection("四个稀有度等级",
                    "成就分为四个稀有度等级：\n\n" +
                    "🥉 普通（灰色）— 入门级成就，如第一篇日记、第一步足迹\n" +
                    "🥈 稀有（蓝色）— 需要一定坚持，如 10 篇日记、5 个省、5 次旅行\n" +
                    "🥇 史诗（紫色）— 较高挑战，如 50 篇日记、20 个省、50 张照片\n" +
                    "💎 传说（金色）— 终极目标，如 100 篇日记、34 个省全点亮\n\n" +
                    "成就页按稀有度分组展示，每个成就带进度条显示当前/目标。"),
            )),
        )),

        GuideNode("report", "年度报告", "📅", sections = listOf(
            GuideSection("年度足迹总结",
                "在日记页点 📅 进入年度报告：\n\n" +
                "• 左右切换年份\n" +
                "• 核心数据：活跃天数、日记篇数、照片数\n" +
                "• 月度活跃度柱状图\n" +
                "• 写作连续性：当前连续 + 最长连续\n" +
                "• 年度心情分析\n\n" +
                "回顾你的每一年，看看自己走了多远。"),
        )),

        GuideNode("home", "首页仪表盘", "🏠", sections = listOf(
            GuideSection("仪表盘",
                "首页是整个 APP 的信息中枢：\n\n" +
                "• 快速统计：日记数、旅行数、省份点亮数\n" +
                "• GPS 采集状态\n" +
                "• 快捷操作：写日记、新旅行、足迹\n" +
                "• 最近 5 篇日记预览\n\n" +
                "底部导航栏可以快速切换到日记、足迹、我的。"),
        )),

        GuideNode("places", "地点收藏", "📌", sections = listOf(
            GuideSection("收藏地点",
                "在日记页点 📌 进入地点收藏：\n\n" +
                "• 6 个分类：美食🍜、景点🏞️、住宿🏨、购物🛍️、交通🚄、其他📍\n" +
                "• 每个地点记录：名称、坐标、分类、备注\n" +
                "• 支持按分类筛选和搜索\n\n" +
                "把去过的好地方收藏起来，下次方便查找。"),
        )),

        GuideNode("sync", "同步与设置", "⚙️", sections = listOf(
            GuideSection("数据同步",
                "Nexus Pocket 采用「离线优先 + WiFi 同步」策略：\n\n" +
                "• 所有数据先保存在本地（Room 数据库）\n" +
                "• 连接 WiFi 时每 15 分钟自动同步\n" +
                "• 同步失败不影响本地使用\n" +
                "• GPS 轨迹保持独立的上传机制"),
            GuideSection("服务器设置",
                "在「我的 → 服务器设置」中配置服务器地址。\n\n" +
                "默认地址为本地 Tailscale 服务器。如果你有自己的部署，修改地址即可。"),
            GuideSection("数据安全",
                "• 所有数据存储在设备本地，不上传到第三方\n" +
                "• 服务器仅用于你自己的数据同步\n" +
                "• 卸载 APP 会清除所有本地数据"),
        )),
    ))

    /** 根据 id 查找节点 */
    fun findById(id: String): GuideNode? = findIn(root, id)

    /** 获取所有叶子节点的有序列表（用于上一篇/下一篇导航） */
    fun getAllLeaves(): List<GuideNode> {
        val leaves = mutableListOf<GuideNode>()
        collectLeaves(root, leaves)
        return leaves
    }

    /** 获取节点的路径（面包屑） */
    fun getPath(targetId: String): List<GuideNode> {
        val path = mutableListOf<GuideNode>()
        findPath(root, targetId, path)
        return path
    }

    private fun findIn(node: GuideNode, id: String): GuideNode? {
        if (node.id == id) return node
        for (child in node.children) {
            val found = findIn(child, id)
            if (found != null) return found
        }
        return null
    }

    private fun collectLeaves(node: GuideNode, leaves: MutableList<GuideNode>) {
        if (node.sections.isNotEmpty()) {
            leaves.add(node)
        }
        node.children.forEach { collectLeaves(it, leaves) }
    }

    private fun findPath(node: GuideNode, targetId: String, path: MutableList<GuideNode>): Boolean {
        path.add(node)
        if (node.id == targetId) return true
        for (child in node.children) {
            if (findPath(child, targetId, path)) return true
        }
        path.removeAt(path.size - 1)
        return false
    }
}
