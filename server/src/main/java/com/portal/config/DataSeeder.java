package com.portal.config;

import com.portal.entity.Award;
import com.portal.entity.Project;
import com.portal.entity.Tag;
import com.portal.repository.ProjectRepository;
import com.portal.repository.TagRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** 首次启动时写入示例数据，便于开箱演示；已有数据则跳过 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final ProjectRepository projectRepository;
    private final TagRepository tagRepository;

    public DataSeeder(ProjectRepository projectRepository, TagRepository tagRepository) {
        this.projectRepository = projectRepository;
        this.tagRepository = tagRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (projectRepository.count() > 0 || tagRepository.count() > 0) {
            return;
        }

        Map<String, Tag> tags = seedTags();
        seedProjects(tags);
    }

    private Map<String, Tag> seedTags() {
        List<String> names = List.of(
                "Python", "PyTorch", "深度学习", "计算机视觉", "边缘计算",
                "Spring Boot", "React", "TypeScript", "Vue", "微信小程序",
                "STM32", "LoRa", "传感器", "MySQL", "Docker", "时空预测");
        return names.stream()
                .map(n -> tagRepository.save(new Tag(n, "tech")))
                .collect(Collectors.toMap(Tag::getName, Function.identity()));
    }

    private void seedProjects(Map<String, Tag> tags) {
        // ── 01 一个项目两个奖项：国赛一等 + 省赛特等 ──
        Project agri = base("基于多模态感知的智慧农情监测系统", "multimodal-agri-monitor",
                "融合无人机影像与地面传感网络的农情监测方案，实现病虫害早期识别与产量预估。",
                cover("Agri+Monitor"), "ai", "done", 2025, 1, "published");
        agri.setMembers("张明远、李思远、王雪、陈皓");
        agri.setAdvisors("王建国、刘晓东");
        agri.setDepartment("计算机科学与技术学院");
        agri.setDemoUrl("https://example.edu/demo/agri");
        agri.setRepoUrl("https://github.com/example/agri-monitor");
        agri.setContent("""
                ## 项目背景

                传统农情巡查依赖人工踏查，覆盖效率低、病害发现滞后。基层农技站普遍缺少
                可负担的监测手段，等到症状肉眼可辨时，防治窗口往往已经错过。

                ## 创新点

                - **多模态融合**：将无人机多光谱影像与地面温湿度、光照传感数据在特征层对齐，
                  较单一影像方案的早期识别准确率提升 14.2 个百分点
                - **小样本适应**：针对病害样本稀缺的现实约束，引入原型网络做小样本分类，
                  新病害只需 20 张标注样本即可上线
                - **端侧部署**：模型经剪枝与量化后压缩至 18MB，可直接运行在农机载算力盒上，
                  断网环境下仍可完成推理

                ## 技术方案

                感知层由无人机与 LoRa 自组网传感节点构成；边缘侧完成影像预处理与推理；
                云端负责模型迭代与农户端小程序的数据服务。

                ## 应用成效

                在省内 3 个县的 12 个示范基地部署，累计监测面积 8600 亩，
                病害平均发现时间较人工巡查提前 6.5 天。
                """);
        agri.setTags(pick(tags, "Python", "PyTorch", "深度学习", "计算机视觉", "边缘计算"));
        agri.replaceAwards(List.of(
                award("中国国际大学生创新大赛", "national", "first",
                        "教育部", LocalDate.of(2025, 10, 18)),
                award("「挑战杯」全国大学生课外学术科技作品竞赛省级选拔赛", "provincial", "special",
                        "共青团省委", LocalDate.of(2025, 6, 12))));
        projectRepository.save(agri);

        // ── 02 ──
        Project edge = base("面向边缘设备的轻量化推理框架", "lite-edge-inference",
                "针对低算力嵌入式平台的推理运行时，支持算子融合与混合精度调度。",
                cover("Edge+Inference"), "software", "done", 2024, 2, "published");
        edge.setMembers("赵坤、孙一凡");
        edge.setAdvisors("郑海峰");
        edge.setDepartment("软件学院");
        edge.setRepoUrl("https://github.com/example/lite-edge");
        edge.setContent("""
                ## 项目背景

                主流推理框架为通用性付出了体积与启动开销的代价，在 MCU 级设备上难以落地。

                ## 创新点

                - **算子融合图重写**：将卷积—批归一—激活序列在编译期折叠为单算子，
                  访存次数减少约 40%
                - **混合精度调度**：按层敏感度自动分配 int8 / fp16，
                  在精度损失小于 1% 的前提下推理提速 2.3 倍
                - **零依赖运行时**：核心运行时仅 210KB，不依赖任何第三方数学库

                ## 技术方案

                前端接收 ONNX 模型，经图优化与量化校准后生成静态调度计划，
                运行时按计划顺序执行，无动态内存分配。

                ## 成果

                在 Cortex-M7 与 RK3568 两类平台上完成验证，
                相比基线方案端到端时延下降 56%。
                """);
        edge.setTags(pick(tags, "Python", "边缘计算", "深度学习"));
        edge.replaceAwards(List.of(
                award("全国大学生软件创新大赛", "provincial", "special",
                        "省教育厅", LocalDate.of(2024, 9, 21))));
        projectRepository.save(edge);

        // ── 03 ──
        Project access = base("校园无障碍导航服务平台", "campus-accessible-nav",
                "为行动不便师生提供的校园路径规划与设施查询平台，覆盖坡道、电梯与无障碍卫生间。",
                cover("Accessible+Nav"), "software", "done", 2025, 3, "published");
        access.setMembers("周静怡、吴天奇、林可");
        access.setAdvisors("陈立新");
        access.setDepartment("信息工程学院");
        access.setDemoUrl("https://example.edu/demo/nav");
        access.setContent("""
                ## 项目背景

                校园导航产品普遍默认使用者健全，台阶、陡坡等对轮椅出行构成阻碍的路段
                不会在路径规划中被规避。

                ## 创新点

                - **无障碍路网建模**：在常规路网基础上标注坡度、路面材质与通行宽度，
                  形成可通行性加权图
                - **众包纠错**：师生可就地上报设施失效（电梯检修、坡道占用），
                  经管理员确认后实时影响路径规划
                - **多模式适配**：分别为轮椅、视障、临时伤病三类需求提供不同的权重策略

                ## 技术方案

                后端基于 Spring Boot 提供路网与设施服务，路径规划采用改进 A* 算法；
                前端为微信小程序，配合语音播报满足视障用户需要。

                ## 应用成效

                覆盖两个校区共 143 栋建筑、310 项无障碍设施，累计服务 1200 余人次。
                """);
        access.setTags(pick(tags, "Spring Boot", "微信小程序", "MySQL"));
        access.replaceAwards(List.of(
                award("中国大学生计算机设计大赛", "national", "second",
                        "教育部高等学校计算机类专业教学指导委员会", LocalDate.of(2025, 8, 5))));
        projectRepository.save(access);

        // ── 04 ──
        Project water = base("低成本水质多参数在线监测终端", "water-quality-terminal",
                "面向中小河湖的低功耗水质监测终端，单机成本控制在千元以内。",
                cover("Water+Quality"), "hardware", "done", 2024, 4, "published");
        water.setMembers("黄鑫、马俊、程雨桐");
        water.setAdvisors("孙建平");
        water.setDepartment("电子信息工程学院");
        water.setContent("""
                ## 项目背景

                商用水质监测站单点造价数万元，中小河湖难以成网部署，
                基层环保部门长期依赖人工取样送检。

                ## 创新点

                - **低成本传感方案**：以国产电极替代进口探头，配合温度补偿与分段标定，
                  溶解氧测量误差控制在 ±0.3 mg/L
                - **超低功耗设计**：休眠电流 12μA，单块 20W 太阳能板可支撑全年不间断运行
                - **自清洁结构**：加装定时旋转刮片，将探头维护周期从两周延长至三个月

                ## 技术方案

                主控采用 STM32L4 系列，通过 LoRa 回传至网关，
                网关经 4G 上云，云端提供超标预警与趋势分析。

                ## 成果

                在 6 条中小河道布设 24 个监测点，连续稳定运行超过 400 天，
                数据有效率 98.6%。
                """);
        water.setTags(pick(tags, "STM32", "LoRa", "传感器"));
        water.replaceAwards(List.of(
                award("全国大学生电子设计竞赛", "provincial", "first",
                        "省教育厅", LocalDate.of(2024, 11, 2)),
                award("大学生节能减排社会实践与科技竞赛校内选拔", "school", "first",
                        "教务处", LocalDate.of(2024, 4, 18))));
        projectRepository.save(water);

        // ── 05 ──
        Project transit = base("城市轨道客流预测与调度优化系统", "transit-flow-forecast",
                "基于时空图神经网络的短时客流预测，为行车调度提供加开与疏导建议。",
                cover("Transit+Forecast"), "bigdata", "done", 2023, 5, "published");
        transit.setMembers("徐安娜、何子恒、罗嘉宁、彭悦");
        transit.setAdvisors("李文博");
        transit.setDepartment("交通运输工程学院");
        transit.setContent("""
                ## 项目背景

                节假日与大型活动期间的客流骤增难以用历史均值预估，
                调度决策高度依赖值班人员经验。

                ## 创新点

                - **时空图建模**：将站点拓扑与换乘关系编码为图结构，
                  15 分钟粒度预测的平均绝对百分比误差降至 7.8%
                - **事件感知**：接入演出、赛事日程作为外部特征，
                  大客流场景下的预测偏差较基线降低 31%
                - **调度建议生成**：在预测基础上给出加开列车与站台限流的组合方案

                ## 技术方案

                数据侧对接 AFC 刷卡流水，特征工程与训练在离线集群完成，
                在线服务以 15 分钟为周期滚动推理。

                ## 成果

                基于某市 3 条线路共 68 座车站的历史数据完成验证，
                方案已提交轨道交通运营单位试用评估。
                """);
        transit.setTags(pick(tags, "Python", "时空预测", "深度学习", "Docker"));
        transit.replaceAwards(List.of(
                award("全国大学生交通科技大赛", "municipal", "first",
                        "市交通运输局", LocalDate.of(2023, 7, 28))));
        projectRepository.save(transit);

        // ── 06 草稿：前台不可见，用于验证可见性控制 ──
        Project heritage = base("非物质文化遗产数字化传播平台", "intangible-heritage-platform",
                "面向地方非遗项目的数字化采集、展陈与传播平台，材料整理中。",
                cover("Heritage"), "business", "ongoing", 2026, 6, "draft");
        heritage.setMembers("宋佳、田野");
        heritage.setAdvisors("方雅琴");
        heritage.setDepartment("人文学院");
        heritage.setContent("""
                ## 项目背景

                地方非遗传承人年龄结构老化，技艺记录零散且缺乏系统性数字归档。

                ## 当前进展

                已完成 3 类共 14 项非遗的影像采集与工艺流程拆解，
                展陈端与传播端仍在开发中，参赛材料整理完成后再行发布。
                """);
        heritage.setTags(pick(tags, "Vue", "TypeScript"));
        heritage.replaceAwards(List.of(
                award("大学生创新创业训练计划校级立项答辩", "school", "second",
                        "教务处", LocalDate.of(2026, 3, 9))));
        projectRepository.save(heritage);
    }

    // ── 构建辅助 ─────────────────────────────────────────────

    private static Project base(String title, String slug, String summary, String coverUrl,
                                String type, String status, int year, int sortOrder,
                                String visibility) {
        Project p = new Project();
        p.setTitle(title);
        p.setSlug(slug);
        p.setSummary(summary);
        p.setCoverUrl(coverUrl);
        p.setType(type);
        p.setStatus(status);
        p.setYear(year);
        p.setSortOrder(sortOrder);
        p.setVisibility(visibility);
        return p;
    }

    private static Award award(String competition, String level, String grade,
                               String organizer, LocalDate date) {
        Award a = new Award();
        a.setCompetition(competition);
        a.setLevel(level);
        a.setGrade(grade);
        a.setOrganizer(organizer);
        a.setAwardDate(date);
        return a;
    }

    /** 占位封面用纸白与墨色，与站点的学术版面一致，不引入额外色相 */
    private static String cover(String text) {
        return "https://placehold.co/800x450/EFEAE0/2B2622/png?text=" + text;
    }

    private static LinkedHashSet<Tag> pick(Map<String, Tag> tags, String... names) {
        LinkedHashSet<Tag> picked = new LinkedHashSet<>();
        for (String name : names) {
            Tag tag = tags.get(name);
            if (tag != null) {
                picked.add(tag);
            }
        }
        return picked;
    }
}
