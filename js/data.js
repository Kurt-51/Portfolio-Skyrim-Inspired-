/**
 * Skyrim Portfolio Data Architecture
 * Tailored for Leon B. Escaner, 4th Year BS Computer Engineering Student at ICCT Colleges.
 * Core Technical Mastery: Dual Expertise in Hardware & Software (Java & Embedded Systems).
 */

export const PORTFOLIO_DATA = {
  profile: {
    name: "Leon B. Escaner",
    dragonName: "Dragonborn",
    title: "Computer Engineer",
    subtitle: "4th Year BS Computer Engineering · Hardware & Software Specialist · ICCT Colleges",
    location: "ICCT Colleges // Philippines",
    status: "For Hire",
    quote: "Bridging the physical realm of hardware and the digital power of software — forging robust enterprise systems and embedded prototypes across the realm.",
    bio: "A 4th year college student at ICCT Colleges, under the program of Bachelor of Science in Computer Engineering, with pioneering mastery at using Java and high-performance computing architectures. Like a master enchanter who binds dragonsoul fire into flawless steel, I forge ultra-responsive digital worlds and embedded systems that run locked at 60 FPS across all realms.",
    stats: [
      { label: "Academic Standing", value: "4th Year BS Computer Engineering (ICCT)" },
      { label: "Dual Discipline", value: "Hardware & Software Engineering" },
      { label: "Key Roles", value: "Project Manager & Lead Programmer" },
      { label: "Gold Septims", value: "100,000 🪙" }
    ]
  },

  skills: [
    {
      id: "hardware-systems",
      title: "Heavy Smithing (Hardware & Computer Architecture)",
      spec: "Digital Logic / Microcontrollers / Circuit Design / Architecture",
      desc: "Comprehensive hardware engineering experience: digital logic circuits, microcontroller interfacing, computer organization, register-level memory operations, and embedded hardware-software integration.",
      tags: ["Computer Architecture", "Digital Logic", "Microcontrollers", "Embedded Hardware", "Circuit Design"]
    },
    {
      id: "java-core",
      title: "Destruction Magic (Core Java & OOP Software)",
      spec: "Java SE / OOP Principles / Data Structures / Algorithms",
      desc: "Mastery of object-oriented principles, robust inheritance, polymorphism, encapsulation, Java Collections Framework, multithreading, and algorithmic problem solving.",
      tags: ["Java SE", "OOP Principles", "Collections Framework", "Streams API", "Multithreading"]
    },
    {
      id: "java-enterprise",
      title: "Restoration (Enterprise Java & Backend Software)",
      spec: "Spring Boot / REST APIs / Relational Databases / JDBC",
      desc: "Summoning scalable backend services, RESTful API endpoints, dependency injection, relational database persistence via JDBC/Hibernate, and secure microservices.",
      tags: ["Spring Boot", "RESTful APIs", "JDBC", "Hibernate / JPA", "MySQL"]
    },
    {
      id: "hardware-software-synergy",
      title: "Enchanting (Hardware-Software Synergy & JVM)",
      spec: "Hardware-Aware Software / JVM Internals / Concurrency",
      desc: "Bridging the physical and digital: understanding CPU caches, memory hierarchies, and hardware thread execution to write ultra-efficient, low-latency Java software.",
      tags: ["Hardware-Software Synergy", "JVM Optimization", "Memory Management", "Concurrency", "Thread Safety"]
    }
  ],

  experience: [
    {
      year: "AY 2025 - 2026 // 1ST TRIMESTER (JUNIOR YEAR)",
      role: "Lead Programmer — Community Vax",
      company: "ICCT Colleges // Object-Oriented Programming (OOP)",
      desc: "Lead Programmer for Community Vax, a web application designed to present the availability of vaccines and real-time vaccination schedules to people based on proximity to local healthcare centers. Architected using robust object-oriented programming principles, clean class hierarchies, and modular service components."
    },
    {
      year: "AY 2025 - 2026 // 3RD TRIMESTER (JUNIOR YEAR)",
      role: "Project Manager — NeuroComm Board Converter",
      company: "ICCT Colleges // Embedded Systems",
      desc: "Project Manager for the NeuroComm Board Converter, an assistive embedded hardware prototype built specifically for individuals with aphasia (an acquired disorder that impairs a person's ability to speak, understand, read, and write). Engineered with 8 dedicated hardware buttons, each pre-programmed with a specific set of words that vocalize messages to the receiver through an onboard speaker upon press."
    }
  ],

  projects: [
    {
      id: "community-vax",
      title: "Community Vax // Vaccine Availability & Scheduling Platform",
      category: "software",
      categoryLabel: "Object-Oriented Web Application",
      desc: "A community-focused web application presenting real-time vaccine availability and schedules to residents based on proximity to nearby health centers. Architected using object-oriented programming principles for OOP subject (AY 2025-2026, 1st Trimester).",
      image: "assets/community-vax.jpg",
      tags: ["Object-Oriented Programming", "Java / Web App", "Public Health", "Vaccine Scheduler", "OOP", "Lead Programmer"],
      link: "#",
      github: "https://github.com/Kurt-51"
    },
    {
      id: "neurocomm-board-converter",
      title: "NeuroComm Board Converter // Assistive Communication System",
      category: "hardware",
      categoryLabel: "Embedded Systems Prototype",
      desc: "An assistive embedded hardware prototype and smart communication system built specifically for individuals with aphasia (an acquired disorder that impairs a person's ability to speak, understand, read, and write). Features 8 dedicated tactile buttons, an onboard speaker for audible speech synthesis, a 16x2 LCD display, and an accompanying smart wearable alert receiver. Built for Embedded Systems (AY 2025-2026, 3rd Trimester).",
      image: "assets/neurocomm-prototype.jpg",
      tags: ["Embedded Systems", "Hardware Prototype", "8-Button Matrix", "Speaker Audio", "Assistive Tech", "Project Manager"],
      link: "#",
      github: "https://github.com/Kurt-51"
    }
  ]
};
