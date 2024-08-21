import { Computer, Network } from "lucide-react";
import { FaBusinessTime } from "react-icons/fa";
import { OrbitingCirclesComponent } from "./orbiting-circles";

const features = [
  {
    name: "Customize according to job description.",
    description:
      "Our AI analyzes job descriptions and tailors your resume to match key requirements. Increase your chances of getting noticed by highlighting the most relevant skills and experiences.",
    icon: Computer,
  },
  {
    name: "Keeps your existing resume design",
    description:
      "Unlike other resume customizers in the market we keep your resume as it is",
    icon: Computer,
  },
  {
    name: "AI - Integrated",
    description:
      "Leverage cutting-edge AI technology(Gpt-4o) to optimize your resume. Our system identifies and emphasizes the most impactful elements of your experience for each specific job application.",
    icon: FaBusinessTime,
  },
  {
    name: "Security",
    description:
      "Your data security is our priority. We use advanced encryption and follow best practices to ensure your API keys and resume details are protected at all times.",
    icon: Network,
  },
];

export default function SideBySide() {
  return (
    <div className="overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
          <p className="mt-2 text-3xl font-bold tracking-tight dark:text-white text-gray-900 sm:text-4xl">
            Beat the ATS, Impress the Recruiter
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
            AI-powered resume customization that gets you past the first round
            and into the interview
          </p>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-9">
                <dt className="inline font-semibold dark:text-gray-100 text-gray-900">
                  <feature.icon
                    className="absolute left-1 top-1 h-5 w-5"
                    aria-hidden="true"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-2 dark:text-gray-400">
                  {feature.description}
                </dd>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* <OrbitingCirclesComponent /> */}
    </div>
  );
}
