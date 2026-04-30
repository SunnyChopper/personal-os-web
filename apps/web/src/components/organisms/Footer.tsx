export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-6">About Me</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                My coding adventure started at 14, when I needed to earn some money. This challenge
                led me to learn coding and build websites for friends, sparking a passion for
                technology that has grown ever since.
              </p>
              <p>
                Over the last 4 years, I've worked professionally, taking on real-world projects
                that have taught me a lot. I've gained hands-on experience in working on a software
                development team, collaborating with various team members to gather requirements and
                build solutions to problems for stakeholders, making a real difference at work.
              </p>
              <p>
                Besides my job, I've also created and published my own applications, with
                CanvasCraft being my latest. These projects have allowed me to explore how to
                quickly prototype an MVP solution with serverless computing and providing it to real
                users, showing what I can do from start to finish.
              </p>
              <p>
                I'm always learning and excited to tackle new challenges. My journey from making
                websites for Xbox Live to developing professional applications and working on
                impactful projects shows my dedication and ability to grow in the tech field.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Let's Connect</h2>
            <div className="flex gap-4">
              <a
                href="https://www.medium.com/@SunnyChopper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors text-2xl"
              >
                M
              </a>
              <a
                href="https://www.twitter.com/sunnychopper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors text-2xl"
              >
                𝕏
              </a>
              <a
                href="https://www.linkedin.com/in/sunnychopper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors text-2xl"
              >
                in
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
          <p>
            Copyright &copy; {currentYear} All rights reserved | This template is made with ❤️ by{' '}
            <a
              href="https://colorlib.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark transition-colors"
            >
              Colorlib
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
