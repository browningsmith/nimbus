%{
#include <stdio.h>
#include <stdlib.h>
int yylex(void);
void yyerror(char *);
%}

%token PLY
%token END_HEADER
%token VALID_FORMAT
%token COMMENT
%token ELEMENT
%token PROPERTY
%token CHAR
%token UCHAR
%token SHORT
%token USHORT
%token INT
%token UINT
%token FLOAT
%token DOUBLE
%token LIST
%token VERTEX
%token FACE
%token VERTEX_INDICES
%token X
%token Y
%token Z
%token NX
%token NY
%token NZ
%token RED
%token GREEN
%token BLUE
%token ALPHA
%token S
%token T
%token INT_LITERAL
%token FLOAT_LITERAL

%%

file:   header elementList
    ;

header: PLY VALID_FORMAT header_contents END_HEADER
    ;

header_contents:    header_contents header_statement
                |   header_statement
                |
                ;

header_statement:   COMMENT
                |   element_statement
                |   property_statement
                ;

element_statement:  ELEMENT VERTEX element_number { printf("Total vertices: %i\n", $3); }
                |   ELEMENT FACE element_number { printf("Total indices: %i\n", $3); }
                ;

element_number: INT_LITERAL { $$ = $1; }
            ;

property_statement: PROPERTY list_type_property
                |   PROPERTY number_type property_id
                ;

list_type_property: LIST list_count number_type property_id
                ;

number_type:    CHAR | UCHAR | SHORT | USHORT | INT | UINT | FLOAT | DOUBLE
            ;

property_id:    X
            |   Y
            |   Z
            |   NX
            |   NY
            |   NZ
            |   RED
            |   GREEN
            |   BLUE
            |   ALPHA
            |   S
            |   T
            |   VERTEX_INDICES
            ;

list_count: UCHAR | USHORT | UINT
        ;

elementList:    elementList number
            |   number
            |
            ;

number: INT_LITERAL | FLOAT_LITERAL
    ;

%%

void yyerror(char *s)
{
    fprintf(stderr, "%s: Line: \n", s);
}

int main(void)
{
    yyparse();
    return 0;
}