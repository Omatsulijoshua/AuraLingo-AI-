import { IsNotEmpty, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MockQuestionAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  answerText: string;
}

export class SubmitSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MockQuestionAnswerDto)
  answers: MockQuestionAnswerDto[];
}
