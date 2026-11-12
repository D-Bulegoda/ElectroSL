
import React, { useState } from 'react';

export default function DigitalPortfolio() {
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newProject = {
      id: Date.now(),
      title,
      description,
      image: image ? URL.createObjectURL(image) : null,
    };

    setProjects([...projects, newProject]);

    setTitle('');
    setDescription('');
    setImage(null);
    e.target.reset();
  };

  const removeProject = (id) => {
    setProjects(projects.filter((project) => project.id !== id));
  };

  return (
    <div className="portfolio-page">
      <h1>My Digital Portfolio</h1>
      <p>Showcase your completed electrical projects and skills.</p>

      <div className="portfolio-form-card">
        <h2>Add Completed Project</h2>

        <form onSubmit={handleSubmit}>
          <label>Project Title</label>
          <input
            type="text"
            placeholder="e.g. House Wiring Installation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label>Project Description</label>
          <textarea
            rows="4"
            placeholder="Describe the work you completed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <label>Project Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0] || null)}
          />

          <button type="submit">Add to Portfolio</button>
        </form>
      </div>

      <section className="portfolio-projects">
        <h2>My Projects ({projects.length})</h2>

        {projects.length === 0 ? (
          <p className="portfolio-empty">
            No projects added yet. Showcase your first project!
          </p>
        ) : (
          <div className="portfolio-grid">
            {projects.map((project) => (
              <div className="portfolio-project-card" key={project.id}>
                {project.image && (
                  <img src={project.image} alt={project.title} />
                )}

                <div className="portfolio-project-content">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>

                  <button onClick={() => removeProject(project.id)}>
                    Remove Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
