%{
#include <stdio.h>
#include <stdlib.h>
void yyerror(char *);
#include "y.tab.h"
int lineno = 0;
%}

%%

ply\n   return PLY;

end_header  return END_HEADER;

format[ \t]+ascii[ \t]1\.0  return VALID_FORMAT;

comment[^\n]*\n     return COMMENT;

element return ELEMENT;

property    return PROPERTY;

char return CHAR;

uchar return UCHAR;

short return SHORT;

ushort return USHORT;

int return INT;

uint    return UINT;

float   return FLOAT;

double  return DOUBLE;

list    return LIST;

vertex  return VERTEX;

face    return FACE;

vertex_index|vertex_indices return VERTEX_INDICES;

x return X;

y return Y;

z return Z;

nx return NX;

ny return NY;

nz return NZ;

red return RED;

green return GREEN;

blue return BLUE;

alpha return ALPHA;

s return S;

t return T;

([+-]?[1-9][0-9]*)|0    return INT_LITERAL;

[+-]?[0-9]*\.[0-9]* return FLOAT_LITERAL;

[ \t\n]+    ;

%%

int yywrap(void)
{
    return 1;
}

