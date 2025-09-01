// Sticky Header
      window.addEventListener("scroll", function () {
        const header = document.querySelector("header");
        header.classList.toggle("sticky", window.scrollY > 0);
      });

      // Mobile Navigation
      const hamburger = document.querySelector(".hamburger");
      const navMenu = document.querySelector(".nav-menu");

      hamburger.addEventListener("click", function () {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
      });

      // Close mobile nav when clicking on a link
      document.querySelectorAll(".nav-menu a").forEach((link) => {
        link.addEventListener("click", () => {
          hamburger.classList.remove("active");
          navMenu.classList.remove("active");
        });
      });

      // Animate elements when they come into view
      const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
          }
        });
      }, observerOptions);

      document
        .querySelectorAll(".skill-category, .project-card, .stat-item")
        .forEach((el) => {
          observer.observe(el);
        });