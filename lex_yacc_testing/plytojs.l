%{
#include <stdio.h>
#include <stdlib.h>
void yyerror(char *);
%}

%%

ply\n   printf("PLY");

end_header  printf("END_HEADER");

format[ \t]+ascii[ \t]1\.0  printf("VALID_FORMAT");

comment[^\n]*\n     printf("COMMENT");

element printf("ELEMENT");

property    printf("PROPERTY");

char printf("CHAR");

uchar printf("UCHAR");

short printf("SHORT");

ushort printf("USHORT");

int printf("INT");

uint    printf("UINT");

float   printf("FLOAT");

double  printf("DOUBLE");

list    printf("LIST");

vertex  printf("VERTEX");

face    printf("FACE");

vertex_index|vertex_indices printf("VERTEX_INDICES");

x printf("X");

y printf("Y");

z printf("Z");

nx printf("NX");

ny printf("NY");

nz printf("NZ");

red printf("RED");

green printf("GREEN");

blue printf("BLUE");

alpha printf("ALPHA");

s printf("S");

t printf("T");

([+-]?[1-9][0-9]*)|0    printf("INT_LITERAL");

[+-]?[0-9]*\.[0-9]* printf("FLOAT_LITERAL");

%%

int yywrap(void)
{
    return 1;
}

void yyerror(char *s) {

    fprintf(stderr, "%s\n", s);
}
