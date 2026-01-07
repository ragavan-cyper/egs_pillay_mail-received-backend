import Skill from "../skill_schema/skill_schema.mjs";
import JOB from "../skill_schema/job_role/job_schema.mjs";

export async function analyzeUser(skills, experience) {
  try {
    const jobs = await JOB.find();
    const normalizedUserSkills = skills.map((s) => s.trim().toUpperCase());
    const userExperience = Number(experience);

    // 1. Find ALL eligible jobs based on SKILLS and EXPERIENCE (Any Domain)
    const eligibleJobs = jobs.filter((job) => {
      const isExpMatch = userExperience >= job.minExperience;

      // Skill match logic
      let isSkillMatch = false;
      if (job.requiredSkills && job.requiredSkills.length > 0) {
        const jobReq = job.requiredSkills.map((s) => s.trim().toUpperCase());
        const matchCount = jobReq.filter((s) =>
          normalizedUserSkills.includes(s)
        ).length;

        // 50% match aana eligible-ah eduthukkalam
        isSkillMatch = matchCount / jobReq.length >= 0.5;
      }

      return isExpMatch && isSkillMatch;
    });

    // 2. Determine current level based on matched jobs
    // Result-la highest level job-ai base panni user level-ai sollurom
    const LEVEL_ORDER = ["Beginner", "Junior", "Mid", "Senior", "Lead"];
    let currentLevel = "Beginner";

    if (eligibleJobs.length > 0) {
      const highestJob = eligibleJobs.sort(
        (a, b) =>
          LEVEL_ORDER.indexOf(b.minLevel) - LEVEL_ORDER.indexOf(a.minLevel)
      )[0];
      currentLevel = highestJob.minLevel;
    }

    // 3. Get Next Learn from levels schema (if matches domain)
    const levels = await Skill.find();
    const matchedSkillLevel = levels.find((l) => l.level === currentLevel);

    // job_role.mjs - 46th line-la irundhu replace pannunga
return {
  currentLevel: currentLevel,
  nextLearn: matchedSkillLevel
    ? matchedSkillLevel.nextLearn
    : ["Keep learning specialized skills"],
  jobsYouCanApply: eligibleJobs.map((j) => ({
    title: j.title,      // <--- Backend-la 'title' nu mathungha
    minLevel: j.minLevel, // <--- Name correct-ah irukkanum
  })),
};
  } catch (error) {
    console.error("Error in analysis:", error);
    throw error;
  }
}

export default analyzeUser;
