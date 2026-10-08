import { Fragment } from "react"
import { Html, Tailwind, Section, Row, Text, Hr, Column, } from "@react-email/components"

export interface ApplicationTemplateProps {
  name: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  highSchoolGraduationYear: string;
  priorDentistryExperience: string;
  positionOfInterest: string;
  heardFrom: string;
  availabilityToStart: string;
  availabilityLocations: string;
  resume: any;
  questionResponse: string;
  additionalInfo: string;
}

export default function ApplicationTemplate(props: ApplicationTemplateProps) {
  const { name, contactInfo, highSchoolGraduationYear, priorDentistryExperience, positionOfInterest, heardFrom, availabilityToStart, availabilityLocations, resume, questionResponse, additionalInfo,} = props
  
  return (
    <Html lang="en">
      <Tailwind>
        <Section className="pb-[24px]">
          <Row>
            <Text className="m-0 font-semibold text-[24px] text-gray-900 leading-[32px]">
              {name}
            </Text>
            <Text className="mt-[8px] text-[16px] text-gray-500 leading-[24px]">
              is applying for the following position: {positionOfInterest}.
            </Text>
          </Row>
        </Section>
        {[
          {
            title: "Full Name",
            description: name,
          },
          {
            title: "Email address",
            description: `${contactInfo.email}`,
          },
          {
            title: "Phone number",
            description: `${contactInfo.phone}`,
          },
          {
            title: "High School Graduation Year",
            description: highSchoolGraduationYear,
          },
          {
            title: "Do you have experience working in dentistry or orthodontics?",
            description: priorDentistryExperience,
          },
          {
            title: "Position you're interested in",
            description: positionOfInterest,
          },
          {
            title: "How did you hear about us?",
            description: heardFrom,
          },
          {
            title: "Would you be available to work all 4 locations?",
            description: availabilityLocations,
          },
          {
            title: "When would you be available to start?",
            description: availabilityToStart,
          },
          {
            title: "What interests you about working with our practice?",
            description: questionResponse,
          },
          {
            title: "Is there anything else you'd like us to know?",
            description: additionalInfo,
          },
        ].map((feature, index) => (
          <Fragment key={feature.title}>
            <Hr className="!border-gray-300 m-0 w-full border border-solid" />
            <Section className="py-[24px]">
              <Row>
                <Column
                  width="48"
                  height="40"
                  className="w-[40px] h-[40px] pr-[8px]"
                  valign="baseline"
                >
                  <Row width="40" align="left">
                    <Column
                      align="center"
                      valign="middle"
                      width="40"
                      height="40"
                      className="h-[40px] font-semibold w-[40px] rounded-full bg-indigo-200 text-indigo-600 p-0"
                    >
                      {index + 1}
                    </Column>
                  </Row>
                </Column>
                <Column width="100%" className="w-full">
                  <Text className="m-0 font-semibold text-[20px] text-gray-900 leading-[28px]">
                    {feature.title}
                  </Text>
                  <Text className="m-0 pt-[8px] text-[16px] text-gray-500 leading-[24px]">
                    {feature.description}
                  </Text>
                </Column>
              </Row>
            </Section>
          </Fragment>
        ))}  
      </Tailwind>
    </Html>
  )
}