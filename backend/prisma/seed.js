import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.profile.upsert({
    where: { id: 1 },
    update: {
      fullName: 'Ilham Muhaimin',
      role: 'Full-Stack JavaScript Developer',
      bio: 'Saya membangun aplikasi web modern end-to-end: dari desain interface, API backend, sampai deployment container yang stabil dan mudah di-scale.',
      location: 'Jakarta, Indonesia',
      email: 'hello@minham.dev',
      website: 'https://minham.dev',
      linkedin: 'https://linkedin.com/in/minham',
      github: 'https://github.com/ilhammu29'
    },
    create: {
      id: 1,
      fullName: 'Ilham Muhaimin',
      role: 'Full-Stack JavaScript Developer',
      bio: 'Saya membangun aplikasi web modern end-to-end: dari desain interface, API backend, sampai deployment container yang stabil dan mudah di-scale.',
      location: 'Jakarta, Indonesia',
      email: 'hello@minham.dev',
      website: 'https://minham.dev',
      linkedin: 'https://linkedin.com/in/minham',
      github: 'https://github.com/ilhammu29'
    }
  });

  const projects = [
    {
      slug: 'invoice-automation-platform',
      title: 'Invoice Automation Platform',
      description: 'Platform untuk otomatisasi pembuatan invoice, reminder pembayaran, dan tracking status klien dalam satu dashboard.',
      longDescription: 'Sistem invoice automation lengkap dengan workflow approval, auto-reminder, dan analytics pembayaran. Dibangun untuk mempercepat proses billing tim operasional.',
      stack: 'React, Node.js, Prisma, PostgreSQL',
      repoUrl: 'https://github.com/ilhammu29/invoice-automation-platform',
      liveUrl: 'https://portfolio-demo.minham.dev/invoice-automation',
      coverImageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1400&auto=format&fit=crop',
      videoUrl: '',
      highlight: true
    },
    {
      slug: 'logistics-tracking-dashboard',
      title: 'Logistics Tracking Dashboard',
      description: 'Dashboard operasional untuk monitoring shipment, SLA pengiriman, serta analitik performa armada secara real-time.',
      longDescription: 'Dashboard logistics dengan visualisasi tracking dan laporan SLA harian. Mendukung tim operasi untuk mendeteksi bottleneck lebih cepat.',
      stack: 'React, Express, Redis, Charting',
      repoUrl: 'https://github.com/ilhammu29/logistics-tracking-dashboard',
      liveUrl: 'https://portfolio-demo.minham.dev/logistics',
      coverImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1400&auto=format&fit=crop',
      videoUrl: '',
      highlight: true
    },
    {
      slug: 'freelance-client-portal',
      title: 'Freelance Client Portal',
      description: 'Portal klien dengan timeline milestone, approval revision, dan update progres project berbasis role access.',
      longDescription: 'Portal kolaborasi klien untuk approval revisi, tracking milestone, dan komunikasi progres project dalam satu alur kerja.',
      stack: 'React, Tailwind, Node.js, SQLite',
      repoUrl: 'https://github.com/ilhammu29/freelance-client-portal',
      liveUrl: 'https://portfolio-demo.minham.dev/client-portal',
      coverImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1400&auto=format&fit=crop',
      videoUrl: '',
      highlight: false
    }
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: project,
      create: project
    });
  }

  const mediaSeed = [
    {
      projectSlug: 'invoice-automation-platform',
      items: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1400&auto=format&fit=crop', caption: 'Dashboard overview', sortOrder: 1 },
        { type: 'image', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1400&auto=format&fit=crop', caption: 'Invoice pipeline', sortOrder: 2 }
      ]
    },
    {
      projectSlug: 'logistics-tracking-dashboard',
      items: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1400&auto=format&fit=crop', caption: 'Shipment monitoring', sortOrder: 1 },
        { type: 'image', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1400&auto=format&fit=crop', caption: 'Analytics view', sortOrder: 2 }
      ]
    }
  ];

  for (const mediaGroup of mediaSeed) {
    const project = await prisma.project.findUnique({ where: { slug: mediaGroup.projectSlug } });
    if (!project) continue;
    await prisma.projectMedia.deleteMany({ where: { projectId: project.id } });
    await prisma.projectMedia.createMany({
      data: mediaGroup.items.map((item) => ({
        ...item,
        projectId: project.id
      }))
    });
  }

  const experiences = [
    {
      company: 'Nusantara Tech Studio',
      role: 'Frontend Engineer',
      startDate: '2021',
      endDate: '2023',
      summary: 'Membangun reusable React component system, meningkatkan Lighthouse score, dan mempercepat delivery fitur lintas tim produk.'
    },
    {
      company: 'ScaleupWorks Indonesia',
      role: 'Full-Stack Developer',
      startDate: '2023',
      endDate: 'Sekarang',
      summary: 'Mendesain API service, dashboard internal, dan pipeline deployment berbasis Docker untuk mendukung rilis produk yang lebih cepat.'
    }
  ];

  await prisma.experience.deleteMany();
  await prisma.experience.createMany({ data: experiences });

  const highlights = [
    { title: 'Clean Architecture', description: 'Struktur kode maintainable untuk jangka panjang.', sortOrder: 1 },
    { title: 'UI Detail', description: 'Tampilan modern dengan ritme visual yang konsisten.', sortOrder: 2 },
    { title: 'Reliable Delivery', description: 'Deploy containerized app yang mudah direplikasi.', sortOrder: 3 }
  ];
  await prisma.aboutHighlight.deleteMany();
  await prisma.aboutHighlight.createMany({ data: highlights });

  const services = [
    { title: 'Frontend Engineering', description: 'Desain UI modern responsive dengan interaksi halus dan aksesibilitas terjaga.', sortOrder: 1 },
    { title: 'Backend API', description: 'Pembuatan API Node.js yang bersih, aman, dan siap integrasi dengan frontend.', sortOrder: 2 },
    { title: 'Docker Deployment', description: 'Setup container, compose, dan pipeline deploy agar maintenance lebih mudah.', sortOrder: 3 }
  ];
  await prisma.serviceItem.deleteMany();
  await prisma.serviceItem.createMany({ data: services });

  const processSteps = [
    { stepNo: '01', title: 'Discover', description: 'Riset kebutuhan dan target bisnis.', sortOrder: 1 },
    { stepNo: '02', title: 'Design', description: 'Menyusun UI flow dan arsitektur teknis.', sortOrder: 2 },
    { stepNo: '03', title: 'Develop', description: 'Implementasi frontend, backend, dan database.', sortOrder: 3 },
    { stepNo: '04', title: 'Deploy', description: 'Deploy, monitor, dan optimasi berkelanjutan.', sortOrder: 4 }
  ];
  await prisma.processStep.deleteMany();
  await prisma.processStep.createMany({ data: processSteps });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
