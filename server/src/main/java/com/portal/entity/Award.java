package com.portal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.List;

/**
 * 一条获奖记录。同一个项目可能在多个比赛中获奖（省赛一等奖 + 国赛二等奖），
 * 因此与 Project 是一对多，而非平铺在 Project 上的几个字段。
 */
@Entity
@Table(name = "awards")
public class Award {

    /** 赛事级别，由高到低。顺序即展示与排序的权重，别随意调换 */
    public static final List<String> LEVELS =
            List.of("international", "national", "provincial", "municipal", "school");

    /** 获奖等级，由高到低。同上 */
    public static final List<String> GRADES =
            List.of("special", "first", "second", "third", "excellence");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** 比赛名称，如「中国国际大学生创新大赛」 */
    @Column(nullable = false, length = 160)
    private String competition;

    /** 见 {@link #LEVELS} */
    @Column(nullable = false, length = 20)
    private String level = "school";

    /** 见 {@link #GRADES} */
    @Column(nullable = false, length = 20)
    private String grade = "third";

    /** 主办单位 */
    @Column(length = 160)
    private String organizer;

    @Column(name = "award_date")
    private LocalDate awardDate;

    /** 获奖证书图片，复用封面上传接口产出的 /uploads/xxx 路径 */
    @Column(name = "certificate_url", length = 500)
    private String certificateUrl;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** 级别在 {@link #LEVELS} 中的下标，用于「先按级别高低排」的比较；未知值排到最后 */
    public static int levelRank(String level) {
        int i = LEVELS.indexOf(level);
        return i < 0 ? LEVELS.size() : i;
    }

    public static int gradeRank(String grade) {
        int i = GRADES.indexOf(grade);
        return i < 0 ? GRADES.size() : i;
    }

    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getCompetition() {
        return competition;
    }

    public void setCompetition(String competition) {
        this.competition = competition;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getOrganizer() {
        return organizer;
    }

    public void setOrganizer(String organizer) {
        this.organizer = organizer;
    }

    public LocalDate getAwardDate() {
        return awardDate;
    }

    public void setAwardDate(LocalDate awardDate) {
        this.awardDate = awardDate;
    }

    public String getCertificateUrl() {
        return certificateUrl;
    }

    public void setCertificateUrl(String certificateUrl) {
        this.certificateUrl = certificateUrl;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
