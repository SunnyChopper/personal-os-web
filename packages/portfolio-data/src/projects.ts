import type { Project } from '@personal-os-web/portfolio-types';

export const projects: Project[] = [
  {
    id: 'canvascraft',
    title: 'CanvasCraft',
    subtitle: 'Built with AWS (Serverless) and React Native',
    description: [
      'Quicket Solutions is a company that I worked at for 6 months. I was the lead developer on the project and was responsible for creating the entire platform from scratch.',
      'The platform is a ticketing system that allows users to create tickets and assign them to other users. The platform also has a chat system that allows users to communicate with each other.',
      'The platform also has a reporting system that allows users to create reports and export them to Excel.',
    ],
    image: '../images/QuicketSolutions.gif',
    technologies: 'AWS (Serverless) and React Native',
    link: 'https://quicketsolutions.com',
    linkText: 'View Website',
  },
  {
    id: 'pathlearn',
    title: 'PathLearn',
    subtitle: 'Built with React Native, Laravel and SQL',
    description: [
      "PathLearn is a mobile application that allows users to create roadmaps for others to learn from. The problem I saw was that there's already a lot of free content on the internet, however, no one has really organized it for learning.",
      'So if someone wanted to learn about Python, they can find a roadmap on Python on the platform to learn from. Other users can create these roadmaps for the community.',
      'The goal was to create an app that helps self-learners know what to learn.',
    ],
    image: '../images/PathLearn.gif',
    technologies: 'React Native, Laravel and SQL',
    link: 'https://github.com/SunnyChopper/pathlearn-app',
    linkText: 'View Github',
  },
  {
    id: 'manyvote',
    title: 'ManyVote',
    subtitle: 'Built with React Native, Laravel and SQL',
    description: [
      'ManyVote is a platform that helps connect local constituents to their local government. It allows citizens to keep track of the bills that are currently being passed through and to help keep their government accountable.',
      'Politicians are able to sign up on the website and be able to intereact with everyday citizens. Politicians can put out polls and ask questions about issues.',
      'Since this is a government based app, I cannot share the Github link with you.',
    ],
    image: '../images/ManyVote.gif',
    technologies: 'React Native, Laravel and SQL',
    link: 'http://manyvoteapp.com',
    linkText: 'View Website',
  },
  {
    id: 'mind-of-habit',
    title: 'Mind of Habit',
    subtitle: 'Built with React Native, Laravel and SQL',
    description: [
      'This app allows users to create habits that they want to create or destroy. Each habit is broken down into levels. If you complete a task for the day, you get points that you can use to purchase rewards.',
      'The rewards are defined by you. If you believe that something is a small reward, you can set the number of points required to purchase it rather low.',
      'This app is flexible and helps you build the habits that you want.',
    ],
    image: '../images/Mind-of-Habit.gif',
    technologies: 'React Native, Laravel and SQL',
    link: 'https://github.com/SunnyChopper/moh-app',
    linkText: 'View Github',
  },
];
